import "server-only";

import type { Mailer, SendEmailInput } from "./mailer";

/*
 * Utilisé hors production (CLAUDE.md, section 9) : aucun e-mail réel n'est envoyé à une vraie
 * adresse. Fait office d'outil de capture local (équivalent Mailpit) sans dépendance supplémentaire.
 * Seul le sujet est journalisé : jamais le destinataire (donnée personnelle, section 8.4).
 */
export function createConsoleMailer(): Mailer {
  return {
    async send(input: SendEmailInput): Promise<void> {
      console.log(`[mailer:dev] E-mail "${input.subject}" — non envoyé (capture locale uniquement).`);
    },
  };
}
