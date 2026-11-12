"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";

import { clientIp } from "@/lib/client-ip";
import { RateLimiter } from "@/lib/rate-limit";

import { emailCodeService } from "./email-code-service";
import { LOGIN_PATH, MFA_RECOVER_PATH, MFA_SETUP_PATH } from "./guards";
import {
  clearPendingMfaChallenge,
  createPendingMfaChallenge,
  EMAIL_RECOVERY_TTL_SECONDS,
  readPendingMfaChallenge,
} from "./mfa-session";
import { getDummyHash, hashPassword, verifyPassword } from "./password";
import { drizzleRecoveryCodeRepository } from "./recovery-code-repository";
import { sendRecoveryCodeInBackground, sendSecurityAlertInBackground } from "./recovery-mailing";
import { emailCodeSchema, passwordResetConfirmSchema, passwordResetRequestSchema } from "./schema";
import { createSession } from "./session";
import { drizzleAdminUserRepository } from "./user-repository";

export type MfaRecoveryState = { error?: string } | null;
export type PasswordResetRequestState = { step: "code"; email: string } | { error: string } | null;
export type PasswordResetConfirmState =
  | { error?: string; fieldErrors?: { email?: string[]; code?: string[]; newPassword?: string[]; confirmPassword?: string[] } }
  | { success: true }
  | null;

const TOO_MANY_ATTEMPTS_MESSAGE = "Trop de tentatives. Réessayez dans quelques minutes.";
const INVALID_CODE_MESSAGE = "Code invalide ou expiré.";

// Limites par IP, distinctes de celles du login (CLAUDE.md, section 8.1). Aussi un garde-fou du quota d'envoi.
const requestLimiter = new RateLimiter(5, 15 * 60 * 1000);
const confirmLimiter = new RateLimiter(10, 15 * 60 * 1000);

/*
 * Cas "téléphone perdu, mot de passe connu". Exige le défi 2FA en attente : seul quelqu'un qui a déjà
 * saisi le bon mot de passe peut demander ce code. Le code part par e-mail vers l'adresse du compte.
 */
export async function requestMfaEmailResetAction(): Promise<MfaRecoveryState> {
  if (!requestLimiter.hit(await clientIp()).allowed) return { error: TOO_MANY_ATTEMPTS_MESSAGE };

  const challenge = await readPendingMfaChallenge();
  if (!challenge) redirect(LOGIN_PATH);

  const user = await drizzleAdminUserRepository.findById(challenge.userId);
  if (!user) {
    await clearPendingMfaChallenge();
    redirect(LOGIN_PATH);
  }

  // null = un code a déjà été envoyé il y a moins d'une minute : il reste valable, on n'en renvoie pas.
  const code = await emailCodeService.issue(user.id, "mfa_reset");
  if (code) sendRecoveryCodeInBackground(user.email, code, "mfa_reset");

  // Laisse le temps d'aller lire l'e-mail (le défi initial expire en 5 min).
  await createPendingMfaChallenge(user.id, EMAIL_RECOVERY_TTL_SECONDS);
  redirect(MFA_RECOVER_PATH);
}

/*
 * Code e-mail valide : la 2FA est réinitialisée (secret et codes de secours supprimés) et la session
 * ouverte, mais requireAdmin() bloque tout sauf /admin/security tant qu'un nouveau téléphone n'est pas enrôlé.
 */
export async function confirmMfaEmailResetAction(
  _previous: MfaRecoveryState,
  formData: FormData,
): Promise<MfaRecoveryState> {
  if (!confirmLimiter.hit(await clientIp()).allowed) return { error: TOO_MANY_ATTEMPTS_MESSAGE };

  const challenge = await readPendingMfaChallenge();
  if (!challenge) redirect(LOGIN_PATH);

  const parsed = emailCodeSchema.safeParse(formData.get("code"));
  if (!parsed.success) return { error: INVALID_CODE_MESSAGE };

  const user = await drizzleAdminUserRepository.findById(challenge.userId);
  if (!user) {
    await clearPendingMfaChallenge();
    redirect(LOGIN_PATH);
  }

  if (!(await emailCodeService.verify(user.id, "mfa_reset", parsed.data))) {
    return { error: INVALID_CODE_MESSAGE };
  }

  await drizzleAdminUserRepository.disableTotp(user.id);
  await drizzleRecoveryCodeRepository.deleteAll(user.id);
  sendSecurityAlertInBackground(user.email, "mfa_reset");

  await clearPendingMfaChallenge();
  await createSession(user.id);
  redirect(MFA_SETUP_PATH);
}

/*
 * Cas "mot de passe oublié". Réponse identique que l'adresse existe ou non (pas d'énumération de
 * comptes) ; tout le travail (lecture, hachage, envoi) se fait après la réponse.
 */
export async function requestPasswordResetAction(
  _previous: PasswordResetRequestState,
  formData: FormData,
): Promise<PasswordResetRequestState> {
  if (!requestLimiter.hit(await clientIp()).allowed) return { error: TOO_MANY_ATTEMPTS_MESSAGE };

  const parsed = passwordResetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Adresse e-mail invalide." };

  const { email } = parsed.data;
  after(async () => {
    const user = await drizzleAdminUserRepository.findByEmail(email);
    if (!user) return;
    const code = await emailCodeService.issue(user.id, "password_reset");
    if (code) sendRecoveryCodeInBackground(user.email, code, "password_reset");
  });

  return { step: "code", email };
}

export async function confirmPasswordResetAction(
  _previous: PasswordResetConfirmState,
  formData: FormData,
): Promise<PasswordResetConfirmState> {
  if (!confirmLimiter.hit(await clientIp()).allowed) return { error: TOO_MANY_ATTEMPTS_MESSAGE };

  const parsed = passwordResetConfirmSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const user = await drizzleAdminUserRepository.findByEmail(parsed.data.email);
  if (!user) {
    // Même durée de réponse qu'un compte existant (cf. auth-service.ts).
    await verifyPassword(await getDummyHash(), parsed.data.code);
    return { error: INVALID_CODE_MESSAGE };
  }

  if (!(await emailCodeService.verify(user.id, "password_reset", parsed.data.code))) {
    return { error: INVALID_CODE_MESSAGE };
  }

  await drizzleAdminUserRepository.updatePasswordHash(user.id, await hashPassword(parsed.data.newPassword));
  // Le verrouillage (5 échecs) est levé : l'admin vient de prouver son identité par e-mail.
  await drizzleAdminUserRepository.updateLockout(user.id, { failedLoginCount: 0, lockedUntil: null });
  sendSecurityAlertInBackground(user.email, "password_reset");

  return { success: true };
}
