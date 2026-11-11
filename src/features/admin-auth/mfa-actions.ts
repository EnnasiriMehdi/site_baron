"use server";

import { redirect } from "next/navigation";

import { clientIp } from "@/lib/client-ip";
import { RateLimiter } from "@/lib/rate-limit";

import { LOGIN_PATH } from "./guards";
import { clearPendingMfaChallenge, readPendingMfaChallenge } from "./mfa-session";
import { verifySecondFactor } from "./mfa-verification";
import { secondFactorCodeSchema } from "./schema";
import { createSession } from "./session";
import { drizzleAdminUserRepository } from "./user-repository";

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

  const challenge = await readPendingMfaChallenge();
  if (!challenge) {
    redirect(LOGIN_PATH);
  }

  const parsed = secondFactorCodeSchema.safeParse(formData.get("code"));
  if (!parsed.success) {
    return { error: INVALID_CODE_MESSAGE };
  }

  const user = await drizzleAdminUserRepository.findById(challenge.userId);
  if (!user) {
    await clearPendingMfaChallenge();
    redirect(LOGIN_PATH);
  }

  const outcome = await verifySecondFactor(user, parsed.data);
  if (outcome === "invalid") {
    return { error: INVALID_CODE_MESSAGE };
  }

  await clearPendingMfaChallenge();
  await createSession(user.id);
  redirect("/admin");
}
