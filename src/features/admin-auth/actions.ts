"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { clientIp } from "@/lib/client-ip";
import { RateLimiter } from "@/lib/rate-limit";

import { authService } from "./auth-instance";
import { LOGIN_PATH, MFA_VERIFY_PATH } from "./guards";
import { alertLoginLocked } from "./login-lockout-alert";
import { createPendingMfaChallenge } from "./mfa-session";
import { destroySession, createSession, readSession } from "./session";
import { loginSchema } from "./schema";
import { drizzleAdminUserRepository } from "./user-repository";

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
    if (result.lockedEmail) alertLoginLocked(result.lockedEmail);
    return { error: INVALID_CREDENTIALS_MESSAGE };
  }

  // redirect() lève une exception interne : il doit rester hors de tout try/catch.
  if (result.mfaRequired) {
    await createPendingMfaChallenge(result.userId, result.sessionVersion);
    redirect(MFA_VERIFY_PATH);
  }

  await createSession(result.userId);
  redirect("/admin");
}

/*
 * Déconnexion « partout » : on incrémente la version de session du compte, ce qui invalide aussi une
 * copie volée du cookie (sinon elle resterait valable jusqu'à 2 h). Contrepartie assumée : se
 * déconnecter d'un appareil déconnecte tous les autres.
 */
export async function logoutAction(): Promise<void> {
  const session = await readSession();
  // D'abord la déconnexion locale : elle doit réussir même si la révocation échoue.
  await destroySession();

  if (session) {
    try {
      await drizzleAdminUserRepository.revokeSessions(session.userId, session.sessionVersion);
    } catch (error) {
      // Jamais d'échec silencieux (CLAUDE.md, section 9) : le nom de l'erreur seulement. Dans ce cas,
      // les autres sessions restent valables jusqu'à leur expiration (2 h).
      console.error(
        `Échec de la révocation des sessions à la déconnexion (${error instanceof Error ? error.name : "erreur inconnue"}).`,
      );
    }
  }

  // Hors du try/catch : redirect() lève une exception interne.
  redirect(LOGIN_PATH);
}
