"use server";

import QRCode from "qrcode";

import { requireAdminSession } from "./guards";
import { allowMfaAttempt } from "./mfa-attempt-guard";
import { clearMfaAttempts, MFA_TOO_MANY_ATTEMPTS_MESSAGE } from "./mfa-rate-limit";
import { verifySecondFactor } from "./mfa-verification";
import { hashPassword } from "./password";
import { drizzleRecoveryCodeRepository } from "./recovery-code-repository";
import { generateRecoveryCodes } from "./recovery-codes";
import { secondFactorCodeSchema } from "./schema";
import { createSession } from "./session";
import { buildTotpUri, generateTotpSecret, verifyTotpCode } from "./totp";
import { drizzleAdminUserRepository } from "./user-repository";

export type EnrollmentStartState = { secret: string; qrDataUrl: string } | { error: string } | null;
export type EnrollmentConfirmState = { recoveryCodes: string[] } | { error: string } | null;
export type DisableMfaState = { error: string } | { success: true } | null;

const INVALID_CODE_MESSAGE = "Code invalide. Réessayez en relisant le code affiché par votre application.";

/*
 * Chaque action revérifie la session (CLAUDE.md, section 8.1) : le layout protège l'affichage,
 * mais une Server Action peut être appelée indépendamment du rendu de la page.
 */
export async function startTotpEnrollmentAction(): Promise<EnrollmentStartState> {
  // Session seule : ces actions servent justement à activer la 2FA (voir requireAdminSession).
  const admin = await requireAdminSession();

  // Sans ce refus, une session volée pouvait remplacer le secret d'une 2FA active et la neutraliser.
  // Pour changer de téléphone : désactiver d'abord avec un code (disableTotpAction).
  if (admin.totpEnabled) {
    return { error: "La double authentification est déjà active. Utilisez « Changer de téléphone »." };
  }

  const secret = generateTotpSecret();
  await drizzleAdminUserRepository.setPendingTotpSecret(admin.userId, secret);

  const uri = buildTotpUri(admin.email, secret);
  const qrDataUrl = await QRCode.toDataURL(uri);

  return { secret, qrDataUrl };
}

export async function confirmTotpEnrollmentAction(
  _previous: EnrollmentConfirmState,
  formData: FormData,
): Promise<EnrollmentConfirmState> {
  const admin = await requireAdminSession();

  if (!allowMfaAttempt(admin.userId, admin.email)) return { error: MFA_TOO_MANY_ATTEMPTS_MESSAGE };

  const parsed = secondFactorCodeSchema.safeParse(formData.get("code"));
  if (!parsed.success) return { error: INVALID_CODE_MESSAGE };

  const user = await drizzleAdminUserRepository.findById(admin.userId);
  if (!user?.totpSecret || user.totpEnabledAt) {
    return { error: "Aucune inscription en cours. Recommencez depuis le début." };
  }

  if (!verifyTotpCode(user.email, user.totpSecret, parsed.data)) {
    return { error: INVALID_CODE_MESSAGE };
  }

  clearMfaAttempts(admin.userId);
  await drizzleAdminUserRepository.enableTotp(admin.userId);
  // enableTotp a révoqué les sessions existantes ; on rouvre celle de l'admin en cours d'enrôlement.
  await createSession(admin.userId);

  const plainCodes = generateRecoveryCodes();
  const hashes = await Promise.all(plainCodes.map((code) => hashPassword(code)));
  await drizzleRecoveryCodeRepository.replaceAll(admin.userId, hashes);

  return { recoveryCodes: plainCodes };
}

export async function disableTotpAction(
  _previous: DisableMfaState,
  formData: FormData,
): Promise<DisableMfaState> {
  const admin = await requireAdminSession();

  if (!allowMfaAttempt(admin.userId, admin.email)) return { error: MFA_TOO_MANY_ATTEMPTS_MESSAGE };

  const parsed = secondFactorCodeSchema.safeParse(formData.get("code"));
  if (!parsed.success) return { error: INVALID_CODE_MESSAGE };

  const user = await drizzleAdminUserRepository.findById(admin.userId);
  if (!user?.totpEnabledAt) return { error: "La double authentification n'est pas active." };

  const outcome = await verifySecondFactor(user, parsed.data);
  if (outcome === "invalid") return { error: INVALID_CODE_MESSAGE };

  clearMfaAttempts(admin.userId);
  await drizzleAdminUserRepository.disableTotp(admin.userId);
  await drizzleRecoveryCodeRepository.deleteAll(admin.userId);
  // Même principe : les autres appareils (ancien téléphone compris) sont déconnectés, pas celui-ci.
  await createSession(admin.userId);

  return { success: true };
}
