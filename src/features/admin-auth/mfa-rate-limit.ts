import "server-only";

import { RateLimiter } from "@/lib/rate-limit";

/*
 * Plafond de tentatives du second facteur, PAR COMPTE et non par IP : un attaquant qui connaît déjà le
 * mot de passe ne doit pas multiplier les essais de codes à 6 chiffres en changeant d'adresse.
 * Trois codes sont valides à chaque instant (window: 1), soit ~3 chances sur 10⁶ par essai.
 *
 * Un seul budget partagé par toutes les actions qui acceptent un code 2FA (connexion, activation,
 * désactivation) : sinon l'une d'elles servirait à contourner la limite de l'autre.
 * Le compteur repart à zéro après un succès (code valide) ET après une récupération par e-mail réussie :
 * sans cela, un attaquant qui épuise le budget bloquerait l'admin, y compris après qu'il a prouvé son
 * identité (voir recovery-actions.ts). Il ne mesure que les échecs consécutifs.
 * Limiteur en mémoire (une seule instance, cf. lib/rate-limit.ts) : un redémarrage le remet à zéro.
 */
export const MFA_MAX_ATTEMPTS = 3;
export const MFA_WINDOW_MS = 24 * 60 * 60 * 1000;

export const MFA_TOO_MANY_ATTEMPTS_MESSAGE =
  "Trop de tentatives de code. La vérification est suspendue (jusqu'à 24 h). Utilisez la récupération par e-mail si vous êtes bloqué.";

export type MfaAttemptStatus = { allowed: true } | { allowed: false; firstBlock: boolean };

const accountLimiter = new RateLimiter(MFA_MAX_ATTEMPTS, MFA_WINDOW_MS);
// Une seule alerte par période de blocage : sans cela, un attaquant qui insiste inonderait la boîte
// e-mail de l'admin (et le quota d'envoi) à chaque tentative refusée.
const alertLimiter = new RateLimiter(1, MFA_WINDOW_MS);

const keyFor = (userId: number): string => `user:${userId}`;

/**
 * À appeler AVANT de vérifier le code. `firstBlock` vaut true une seule fois par période de blocage :
 * c'est le moment d'alerter l'admin.
 */
export function consumeMfaAttempt(userId: number, now: number = Date.now()): MfaAttemptStatus {
  if (accountLimiter.hit(keyFor(userId), now).allowed) return { allowed: true };
  return { allowed: false, firstBlock: alertLimiter.hit(keyFor(userId), now).allowed };
}

/** À appeler après un code valide ou une récupération par e-mail réussie. */
export function clearMfaAttempts(userId: number): void {
  accountLimiter.reset(keyFor(userId));
  alertLimiter.reset(keyFor(userId));
}
