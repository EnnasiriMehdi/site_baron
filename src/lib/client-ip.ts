import "server-only";

import { isIP } from "node:net";

import { headers } from "next/headers";

const UNKNOWN_IP = "unknown";

/*
 * X-Forwarded-For est une liste "client, proxy1, proxy2" que le visiteur peut écrire lui-même.
 * Notre reverse proxy (Caddy/Nginx, un seul niveau) y ajoute l'adresse réelle qu'il a vue EN DERNIER
 * (ou remplace toute la liste, selon sa configuration) : seule la dernière valeur est donc fiable.
 * Prendre la première permettrait de contourner les limites de débit en changeant de fausse IP à
 * chaque essai. X-Real-IP n'est volontairement pas lu : un proxy qui ne le réécrit pas le laisserait
 * forger par le visiteur.
 *
 * Exigence de déploiement : l'application ne doit être joignable QUE via le reverse proxy.
 * Fonction pure (sans next/headers) pour être testée.
 */
export function pickClientIp(forwardedFor: string | null): string {
  const last = forwardedFor?.split(",").at(-1)?.trim();
  // Refuse toute valeur qui n'est pas une adresse IP : la clé alimente la mémoire du limiteur.
  return last && isIP(last) ? last : UNKNOWN_IP;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return pickClientIp(h.get("x-forwarded-for"));
}
