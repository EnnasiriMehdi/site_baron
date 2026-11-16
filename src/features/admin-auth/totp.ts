import "server-only";

import { Secret, TOTP } from "otpauth";

import { siteConfig } from "@/config/site";

/*
 * TOTP standard (RFC 6238), compatible avec toute application d'authentification
 * (Google Authenticator, Authy, 1Password...). Aucun service tiers, aucun coût.
 */
function buildTotp(email: string, secret: string): TOTP {
  return new TOTP({
    issuer: siteConfig.name,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
}

export function generateTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

export function buildTotpUri(email: string, secret: string): string {
  return buildTotp(email, secret).toString();
}

/*
 * Accepte une petite tolérance d'horloge (une période avant/après) : window: 1, soit environ
 * 90 secondes de validité au total.
 * Un code n'est PAS à usage unique : rien ne mémorise qu'il a déjà servi, il peut être rejoué
 * dans cette fenêtre. Risque accepté (il faut déjà le mot de passe et voir le code), voir
 * claude_perso/report.md. Correctif possible : mémoriser le dernier compteur accepté.
 */
export function verifyTotpCode(email: string, secret: string, code: string): boolean {
  const delta = buildTotp(email, secret).validate({ token: code, window: 1 });
  return delta !== null;
}
