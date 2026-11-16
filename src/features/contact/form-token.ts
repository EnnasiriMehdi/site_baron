import "server-only";

import { jwtVerify, SignJWT } from "jose";

import { getEnv } from "@/lib/env";

/*
 * Jeton signé délivré quand le formulaire s'affiche et renvoyé avec l'envoi. Un robot qui poste
 * directement sur l'action, sans jamais charger la page, n'en a pas et est refusé. Sans état : rien
 * n'est stocké, donc le jeton n'est pas à usage unique (le limiteur de débit couvre le rejeu).
 * Ralentit les scripts simples ; n'arrête pas un robot qui charge vraiment la page.
 */
const ISSUER = "site-contact-form";
const AUDIENCE = "site-contact-form";
const TTL_SECONDS = 60 * 60;
// Un humain ne remplit pas un formulaire en moins de 2 secondes : un envoi instantané est un script.
export const MIN_FILL_SECONDS = 2;

function signingKey(): Uint8Array {
  return new TextEncoder().encode(getEnv().SESSION_SECRET);
}

export async function createFormToken(): Promise<string> {
  return new SignJWT({ purpose: "contact_form" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(signingKey());
}

export async function verifyFormToken(token: unknown, now: number = Date.now()): Promise<boolean> {
  if (typeof token !== "string" || token.length === 0) return false;
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
      currentDate: new Date(now),
    });
    if (typeof payload.iat !== "number") return false;
    return now / 1000 - payload.iat >= MIN_FILL_SECONDS;
  } catch {
    return false;
  }
}
