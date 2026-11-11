import "server-only";

import { verifyPassword } from "./password";
import { drizzleRecoveryCodeRepository, type RecoveryCodeRepository } from "./recovery-code-repository";
import { looksLikeRecoveryCode, normalizeRecoveryCode } from "./recovery-codes";
import { verifyTotpCode } from "./totp";
import type { User } from "@/lib/db/schema";

export type SecondFactorResult = "totp" | "recovery" | "invalid";

/*
 * Un utilisateur tape soit un code TOTP à 6 chiffres, soit un code de secours "XXXXX-XXXXX".
 * Un code de secours valide est marqué utilisé immédiatement : il ne doit jamais être réutilisable.
 */
export async function verifySecondFactor(
  user: User,
  rawCode: string,
  recoveryRepository: RecoveryCodeRepository = drizzleRecoveryCodeRepository,
): Promise<SecondFactorResult> {
  if (!user.totpSecret || !user.totpEnabledAt) return "invalid";

  if (looksLikeRecoveryCode(rawCode)) {
    const normalized = normalizeRecoveryCode(rawCode);
    const unused = await recoveryRepository.findUnused(user.id);
    for (const candidate of unused) {
      if (await verifyPassword(candidate.codeHash, normalized)) {
        await recoveryRepository.markUsed(candidate.id);
        return "recovery";
      }
    }
    return "invalid";
  }

  return verifyTotpCode(user.email, user.totpSecret, rawCode) ? "totp" : "invalid";
}
