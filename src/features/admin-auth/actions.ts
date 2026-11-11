"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { clientIp } from "@/lib/client-ip";
import { RateLimiter } from "@/lib/rate-limit";

import { authService } from "./auth-instance";
import { LOGIN_PATH, MFA_VERIFY_PATH } from "./guards";
import { createPendingMfaChallenge } from "./mfa-session";
import { destroySession, createSession } from "./session";
import { loginSchema } from "./schema";

export type LoginFormState = {
  error?: string;
  fieldErrors?: { email?: string[]; password?: string[] };
} | null;

// Message identique pour un mauvais mot de passe, un e-mail inconnu ou un compte verrouillé.
const INVALID_CREDENTIALS_MESSAGE = "Identifiants invalides ou compte temporairement bloqué.";
const TOO_MANY_ATTEMPTS_MESSAGE = "Trop de tentatives. Réessayez dans quelques minutes.";

// 10 tentatives par adresse IP sur 15 minutes, en plus du verrouillage par compte.
const loginRateLimiter = new RateLimiter(10, 15 * 60 * 1000);

export async function loginAction(_previous: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const limit = loginRateLimiter.hit(await clientIp());
  if (!limit.allowed) {
    return { error: TOO_MANY_ATTEMPTS_MESSAGE };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return { fieldErrors };
  }

  const result = await authService.authenticate(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    return { error: INVALID_CREDENTIALS_MESSAGE };
  }

  // redirect() lève une exception interne : il doit rester hors de tout try/catch.
  if (result.mfaRequired) {
    await createPendingMfaChallenge(result.userId);
    redirect(MFA_VERIFY_PATH);
  }

  await createSession(result.userId);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect(LOGIN_PATH);
}
