import "server-only";

import { drizzleLeadRepository } from "@/features/leads";
import { createContactService } from "./service";

/*
 * Point d'assemblage (composition root). Aucun e-mail n'est envoyé au visiteur : une confirmation
 * envoyée à une adresse non vérifiée servait de relais d'e-mails (nom et objet choisis par un tiers,
 * expédiés depuis l'adresse de l'entreprise). La notification à l'ADMIN (adresse fixe, jamais choisie
 * par le visiteur) sera ajoutée ici et dans le service (voir report.md, section 3).
 */
export const contactService = createContactService(drizzleLeadRepository);
