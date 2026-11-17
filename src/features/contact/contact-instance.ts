import "server-only";

import { after } from "next/server";

import { drizzleAdminRecipients } from "@/features/admin-auth";
import { drizzleLeadRepository } from "@/features/leads";
import { notificationService } from "@/features/notifications";
import { createNewLeadNotifier } from "./new-lead-notifier";
import { createContactService } from "./service";

/*
 * Point d'assemblage (composition root). Aucun e-mail n'est envoyé au visiteur : une confirmation
 * envoyée à une adresse non vérifiée servait de relais d'e-mails (nom et objet choisis par un tiers,
 * expédiés depuis l'adresse de l'entreprise). La notification part à l'ADMIN seulement, à l'adresse de son
 * compte lue en base à chaque envoi (jamais choisie par le visiteur, jamais figée dans le .env), après
 * l'enregistrement et après la réponse HTTP (after) : la lenteur du SMTP ne se voit pas côté visiteur.
 */
const newLeadNotifier = createNewLeadNotifier({
  listRecipients: () => drizzleAdminRecipients.listAdminEmails(),
  sendNotification: (recipient, notice) => notificationService.sendNewLeadNotification(recipient, notice),
  sendLimitNotice: (recipient) => notificationService.sendNewLeadLimitNotice(recipient),
});

export const contactService = createContactService(drizzleLeadRepository, undefined, (notice) => {
  after(() => newLeadNotifier(notice));
});
