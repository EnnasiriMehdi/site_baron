import "server-only";

import { RateLimiter } from "@/lib/rate-limit";

import { sendSecurityAlertInBackground } from "./recovery-mailing";

/*
 * Prévient l'admin quand quelqu'un a verrouillé son compte (5 mots de passe erronés). Au plus une alerte
 * par adresse et par 24 h : sans cela, un script qui reverrouille le compte toutes les 15 minutes
 * enverrait ~96 e-mails par jour (boîte inondée, quota d'envoi consommé).
 * Limiteur en mémoire : un redémarrage du serveur en autorise une nouvelle.
 */
const ALERT_WINDOW_MS = 24 * 60 * 60 * 1000;
const alertLimiter = new RateLimiter(1, ALERT_WINDOW_MS);

export function alertLoginLocked(accountEmail: string, now: number = Date.now()): void {
  if (!alertLimiter.hit(accountEmail.toLowerCase(), now).allowed) return;
  sendSecurityAlertInBackground(accountEmail, "login_locked");
}
