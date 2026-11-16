import "server-only";

import { consumeMfaAttempt } from "./mfa-rate-limit";
import { sendSecurityAlertInBackground } from "./recovery-mailing";

/*
 * Point d'entrée unique des actions qui acceptent un code 2FA : consomme un essai du compte et, au
 * moment où le plafond est atteint, prévient l'admin par e-mail (une seule fois par période de blocage).
 * Retourne false quand l'essai doit être refusé.
 */
export function allowMfaAttempt(userId: number, email: string): boolean {
  const status = consumeMfaAttempt(userId);
  if (status.allowed) return true;

  if (status.firstBlock) sendSecurityAlertInBackground(email, "mfa_locked");
  return false;
}
