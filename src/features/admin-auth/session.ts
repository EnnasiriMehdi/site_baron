import "server-only";

import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

import { getEnv } from "@/lib/env";

import { drizzleAdminUserRepository } from "./user-repository";

export const SESSION_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 2;
const ISSUER = "site-admin";
const AUDIENCE = "site-admin";

export type AdminSession = { userId: number; sessionVersion: number };

function signingKey(): Uint8Array {
  return new TextEncoder().encode(getEnv().SESSION_SECRET);
}

/*
 * Lit la version courante en base au moment de signer : l'appelant qui vient de révoquer les autres
 * sessions (changement de mot de passe, de 2FA…) reçoit ainsi un jeton à jour et reste connecté,
 * sans avoir à passer la version à la main.
 */
export async function createSession(userId: number): Promise<void> {
  const user = await drizzleAdminUserRepository.findById(userId);
  if (!user) throw new Error("Impossible d'ouvrir une session pour un compte inexistant.");

  const token = await new SignJWT({ role: "admin", sv: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(signingKey());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: getEnv().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/*
 * Lit et vérifie le jeton. Ne fait pas foi à lui seul : la garde (guards.ts) revérifie
 * que l'utilisateur existe encore en base ET que la version du jeton est toujours la bonne.
 * Un jeton sans version (émis avant cette protection) est refusé.
 */
export async function readSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
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

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
