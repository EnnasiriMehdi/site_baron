import "server-only";

import { generateEmailCode, normalizeEmailCode } from "./email-code";
import {
  drizzleEmailCodeRepository,
  type EmailCodePurpose,
  type EmailCodeRepository,
} from "./email-code-repository";
import { hashPassword, verifyPassword } from "./password";

export const EMAIL_CODE_TTL_MS = 15 * 60 * 1000;
export const EMAIL_CODE_COOLDOWN_MS = 60 * 1000;
export const EMAIL_CODE_MAX_ATTEMPTS = 5;

/*
 * Règle métier des codes envoyés par e-mail : émission (avec délai minimal entre deux envois) et
 * vérification (expiration, nombre d'essais, usage unique). Ne sait rien de HTTP ni d'e-mail (SRP) :
 * l'appelant envoie le code retourné.
 */
export function createEmailCodeService(repository: EmailCodeRepository) {
  return {
    // Retourne le code en clair à envoyer, ou null si un code a été émis il y a moins d'une minute
    // (protège le quota d'envoi et empêche d'inonder la boîte de l'admin).
    async issue(userId: number, purpose: EmailCodePurpose, now: Date = new Date()): Promise<string | null> {
      const latest = await repository.findLatest(userId, purpose);
      if (latest && now.getTime() - latest.createdAt.getTime() < EMAIL_CODE_COOLDOWN_MS) {
        return null;
      }

      const code = generateEmailCode();
      await repository.replace({
        userId,
        purpose,
        codeHash: await hashPassword(code),
        expiresAt: new Date(now.getTime() + EMAIL_CODE_TTL_MS),
        createdAt: now,
      });
      return code;
    },

    async verify(
      userId: number,
      purpose: EmailCodePurpose,
      rawCode: string,
      now: Date = new Date(),
    ): Promise<boolean> {
      const latest = await repository.findLatest(userId, purpose);
      if (!latest || latest.usedAt) return false;
      if (latest.expiresAt.getTime() <= now.getTime()) return false;
      if (latest.attempts >= EMAIL_CODE_MAX_ATTEMPTS) return false;

      // L'essai est compté avant la comparaison : on ne peut pas contourner la limite en rejouant
      // des requêtes simultanées.
      await repository.incrementAttempts(latest.id);

      const valid = await verifyPassword(latest.codeHash, normalizeEmailCode(rawCode));
      if (!valid) return false;

      await repository.markUsed(latest.id, now);
      return true;
    },
  };
}

export type EmailCodeService = ReturnType<typeof createEmailCodeService>;

export const emailCodeService = createEmailCodeService(drizzleEmailCodeRepository);
