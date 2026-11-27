import "server-only";

import type { Mailer } from "@/lib/mailer";
import { buildAdminSecurityAlertEmail, type AdminSecurityAlertInput } from "./templates/admin-security-alert";
import { buildAdminSecurityCodeEmail, type AdminSecurityCodeInput } from "./templates/admin-security-code";
import {
  buildNewLeadLimitEmail,
  buildNewLeadNotificationEmail,
  type NewLeadNotificationInput,
} from "./templates/new-lead-notification";
import { buildStorageWarningEmail, type StorageWarningInput } from "./templates/storage-warning";

// Dépend de l'interface Mailer (DIP) : les tests injectent un double sans toucher au réseau.
export function createNotificationService(mailer: Mailer) {
  return {
    async sendAdminSecurityCode(recipientEmail: string, input: AdminSecurityCodeInput): Promise<void> {
      const email = buildAdminSecurityCodeEmail(input);
      await mailer.send({ to: recipientEmail, subject: email.subject, html: email.html, text: email.text });
    },

    async sendAdminSecurityAlert(recipientEmail: string, input: AdminSecurityAlertInput): Promise<void> {
      const email = buildAdminSecurityAlertEmail(input);
      await mailer.send({ to: recipientEmail, subject: email.subject, html: email.html, text: email.text });
    },

    // recipientEmail vient de la base (compte admin), jamais du visiteur.
    async sendNewLeadNotification(recipientEmail: string, input: NewLeadNotificationInput): Promise<void> {
      const email = buildNewLeadNotificationEmail(input);
      await mailer.send({ to: recipientEmail, subject: email.subject, html: email.html, text: email.text });
    },

    async sendNewLeadLimitNotice(recipientEmail: string): Promise<void> {
      const email = buildNewLeadLimitEmail();
      await mailer.send({ to: recipientEmail, subject: email.subject, html: email.html, text: email.text });
    },

    async sendStorageWarning(recipientEmail: string, input: StorageWarningInput): Promise<void> {
      const email = buildStorageWarningEmail(input);
      await mailer.send({ to: recipientEmail, subject: email.subject, html: email.html, text: email.text });
    },
  };
}

export type NotificationService = ReturnType<typeof createNotificationService>;
