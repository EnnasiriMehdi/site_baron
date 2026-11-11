import "server-only";

import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

import { getEnv } from "@/lib/env";

const PENDING_COOKIE = "admin_mfa_pending";
const PENDING_TTL_SECONDS = 5 * 60;
// Issuer/audience différents de la session complète (session.ts) : un jeton "en attente de 2FA"
// ne doit jamais pouvoir être confondu avec une session admin valide.
const ISSUER = "site-admin-mfa";
const AUDIENCE = "site-admin-mfa";

function signingKey(): Uint8Array {
  return new TextEncoder().encode(getEnv().SESSION_SECRET);
}

export async function createPendingMfaChallenge(userId: number): Promise<void> {
  const token = await new SignJWT({ purpose: "mfa_pending" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${PENDING_TTL_SECONDS}s`)
    .sign(signingKey());

  const store = await cookies();
  store.set(PENDING_COOKIE, token, {
    httpOnly: true,
    secure: getEnv().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_TTL_SECONDS,
  });
}

export async function readPendingMfaChallenge(): Promise<{ userId: number } | null> {
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
    return Number.isInteger(userId) && userId > 0 ? { userId } : null;
  } catch {
    return null;
  }
}

export async function clearPendingMfaChallenge(): Promise<void> {
  const store = await cookies();
  store.delete(PENDING_COOKIE);
}
