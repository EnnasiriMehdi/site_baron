import "server-only";

import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

import { getEnv } from "@/lib/env";

const PENDING_COOKIE = "admin_mfa_pending";
const PENDING_TTL_SECONDS = 5 * 60;
// Prolongé quand l'admin demande un code par e-mail : le temps d'aller lire sa boîte (le code
// e-mail lui-même expire en 15 min, voir email-code-service.ts).
export const EMAIL_RECOVERY_TTL_SECONDS = 15 * 60;
// Issuer/audience différents de la session complète (session.ts) : un jeton "en attente de 2FA"
// ne doit jamais pouvoir être confondu avec une session admin valide.
const ISSUER = "site-admin-mfa";
const AUDIENCE = "site-admin-mfa";

function signingKey(): Uint8Array {
  return new TextEncoder().encode(getEnv().SESSION_SECRET);
}

// sessionVersion : version des sessions du compte au moment du mot de passe validé. Si elle change
// entre-temps (mot de passe modifié ailleurs…), le défi est refusé (voir pending-challenge.ts).
export async function createPendingMfaChallenge(
  userId: number,
  sessionVersion: number,
  ttlSeconds: number = PENDING_TTL_SECONDS,
): Promise<void> {
  const token = await new SignJWT({ purpose: "mfa_pending", sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(signingKey());

  const store = await cookies();
  store.set(PENDING_COOKIE, token, {
    httpOnly: true,
    secure: getEnv().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttlSeconds,
  });
}

export async function readPendingMfaChallenge(): Promise<{ userId: number; sessionVersion: number } | null> {
  const store = await cookies();
  const token = store.get(PENDING_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const userId = Number(payload.sub);
    const sessionVersion = payload.sv;
    if (!Number.isInteger(userId) || userId <= 0) return null;
    if (typeof sessionVersion !== "number" || !Number.isInteger(sessionVersion)) return null;
    return { userId, sessionVersion };
  } catch {
    return null;
  }
}

export async function clearPendingMfaChallenge(): Promise<void> {
  const store = await cookies();
  store.delete(PENDING_COOKIE);
}
