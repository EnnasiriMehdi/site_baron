import "server-only";

import { RateLimiter } from "@/lib/rate-limit";

import type { NewLeadNotice } from "./service";

// Plafond d'e-mails de notification, tous visiteurs confondus : un bot multi-IP (risk.md R6) provoquerait
// sinon un e-mail par fausse demande, noyant la boîte de l'admin et épuisant le quota SMTP.
export const NEW_LEAD_MAX_EMAILS = 10;
export const NEW_LEAD_WINDOW_MS = 60 * 60 * 1000;

type Deps = {
  listRecipients(): Promise<string[]>;
  sendNotification(recipient: string, notice: NewLeadNotice): Promise<void>;
  sendLimitNotice(recipient: string): Promise<void>;
  now?: () => number;
};

function logFailure(error: unknown): void {
  // Nom de l'erreur seulement : ni adresse ni donnée de la demande dans les logs (CLAUDE.md, section 8.4).
  console.error(
    `Échec de l'envoi de la notification de nouvelle demande (${error instanceof Error ? error.name : "erreur inconnue"}).`,
  );
}

async function sendToAll(recipients: string[], send: (recipient: string) => Promise<void>): Promise<void> {
  const results = await Promise.allSettled(recipients.map(send));
  for (const result of results) {
    if (result.status === "rejected") logFailure(result.reason);
  }
}

/*
 * Ne lève jamais d'erreur : la demande est déjà enregistrée, une notification ratée ne doit pas la remettre
 * en cause (CLAUDE.md, section 9). Le plafond est en mémoire (risk.md R4) : un redémarrage le remet à zéro.
 */
export function createNewLeadNotifier(deps: Deps): (notice: NewLeadNotice) => Promise<void> {
  const emailLimiter = new RateLimiter(NEW_LEAD_MAX_EMAILS, NEW_LEAD_WINDOW_MS);
  const limitNoticeLimiter = new RateLimiter(1, NEW_LEAD_WINDOW_MS);

  return async (notice) => {
    try {
      const now = deps.now?.() ?? Date.now();
      const withinLimit = emailLimiter.hit("global", now).allowed;
      if (!withinLimit && !limitNoticeLimiter.hit("global", now).allowed) return;

      const recipients = await deps.listRecipients();
      if (recipients.length === 0) {
        console.error("Notification de nouvelle demande : aucun compte administrateur en base.");
        return;
      }

      if (withinLimit) {
        await sendToAll(recipients, (recipient) => deps.sendNotification(recipient, notice));
      } else {
        await sendToAll(recipients, (recipient) => deps.sendLimitNotice(recipient));
      }
    } catch (error) {
      logFailure(error);
    }
  };
}
