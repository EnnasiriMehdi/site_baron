import "server-only";

import type { Mailer } from "@/lib/mailer";
import { buildContactConfirmationEmail, type ContactConfirmationInput } from "./templates/contact-confirmation";

// Dépend de l'interface Mailer (DIP) : les tests injectent un double sans toucher au réseau.
export function createNotificationService(mailer: Mailer) {
  return {
    async sendContactConfirmation(input: ContactConfirmationInput): Promise<void> {
      const email = buildContactConfirmationEmail(input);
      await mailer.send({
        to: input.recipientEmail,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
    },
  };
}

export type NotificationService = ReturnType<typeof createNotificationService>;
export type { ContactConfirmationInput } from "./templates/contact-confirmation";
