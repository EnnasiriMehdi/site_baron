import "server-only";

import { drizzleLeadRepository } from "@/features/leads";
import { notificationService } from "@/features/notifications";
import { createContactService } from "./service";

// Point d'assemblage (composition root) : seules implémentations concrètes injectées.
export const contactService = createContactService(drizzleLeadRepository, (input) =>
  notificationService.sendContactConfirmation({
    recipientEmail: input.email,
    recipientName: input.name,
    subject: input.subject,
  }),
);
