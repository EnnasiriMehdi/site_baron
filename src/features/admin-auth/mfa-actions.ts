"use server";

import { redirect } from "next/navigation";

import { clientIp } from "@/lib/client-ip";
import { RateLimiter } from "@/lib/rate-limit";

import { LOGIN_PATH } from "./guards";
import { clearPendingMfaChallenge } from "./mfa-session";
import { allowMfaAttempt } from "./mfa-attempt-guard";
import { clearMfaAttempts, MFA_TOO_MANY_ATTEMPTS_MESSAGE } from "./mfa-rate-limit";
import { verifySecondFactor } from "./mfa-verification";
import { loadPendingChallengeUser } from "./pending-challenge";
import { secondFactorCodeSchema } from "./schema";
import { createSession } from "./session";

export type MfaFormState = { error?: string } | null;

const INVALID_CODE_MESSAGE = "Code invalide ou expiré.";
const TOO_MANY_ATTEMPTS_MESSAGE = "Trop de tentatives. Réessayez dans quelques minutes.";

// Fenêtre distincte du login : un attaquant qui a déjà le mot de passe ne doit pas pouvoir
// essayer des codes 2FA indéfiniment.
const mfaRateLimiter = new RateLimiter(10, 15 * 60 * 1000);

export async function verifyMfaAction(_previous: MfaFormState, formData: FormData): Promise<MfaFormState> {
  const limit = mfaRateLimiter.hit(await clientIp());
  if (!limit.allowed) {
    return { error: TOO_MANY_ATTEMPTS_MESSAGE };
  }

  const user = await loadPendingChallengeUser();
  if (!user) {
    redirect(LOGIN_PATH);
  }

  // Plafond par compte, avant toute vérification (même un code mal formé consomme un essai).
  if (!allowMfaAttempt(user.id, user.email)) {
    return { error: MFA_TOO_MANY_ATTEMPTS_MESSAGE };
  }

  const parsed = secondFactorCodeSchema.safeParse(formData.get("code"));
  if (!parsed.success) {
    return { error: INVALID_CODE_MESSAGE };
  }

  const outcome = await verifySecondFactor(user, parsed.data);
  if (outcome === "invalid") {
    return { error: INVALID_CODE_MESSAGE };
  }

  clearMfaAttempts(user.id);
  await clearPendingMfaChallenge();
  await createSession(user.id);
  redirect("/admin");
}
