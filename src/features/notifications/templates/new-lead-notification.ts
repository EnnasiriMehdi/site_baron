import { siteConfig } from "@/config/site";

import { adminUrl, renderAdminNotice } from "./admin-notice";
import type { RenderedEmail } from "./rendered-email";

export type NewLeadNotificationInput = {
  leadId: number;
  attachmentCount: number;
};

/*
 * Aucune donnée saisie par le visiteur dans cet e-mail (nom, objet, message, téléphone, e-mail) : tout champ du
 * formulaire est du texte libre, donc un lien trompeur glissé dans l'objet arriverait dans la boîte de l'admin
 * depuis l'adresse de l'entreprise (CLAUDE.md, section 9). Seules des valeurs que le serveur contrôle :
 * un identifiant numérique et un nombre de pièces jointes. Les détails se lisent dans l'admin (2FA).
 */
export function buildNewLeadNotificationEmail(input: NewLeadNotificationInput): RenderedEmail {
  const lines = ["Une nouvelle demande vient d'être envoyée par le formulaire de contact."];
  if (input.attachmentCount > 0) {
    lines.push(`Pièces jointes : ${input.attachmentCount}.`);
  }
  lines.push("Consultez-la dans l'administration (connexion avec double authentification) :");

  return renderAdminNotice(
    `${siteConfig.name} — Nouvelle demande d'intervention`,
    lines,
    adminUrl(`/admin/leads/${encodeURIComponent(String(input.leadId))}`),
  );
}

// Envoyée une seule fois par heure quand le plafond d'e-mails est atteint : les demandes suivantes sont bien
// enregistrées, seule leur notification individuelle est suspendue (protection de la boîte et du quota SMTP).
export function buildNewLeadLimitEmail(): RenderedEmail {
  return renderAdminNotice(
    `${siteConfig.name} — Beaucoup de demandes reçues`,
    [
      "Beaucoup de demandes arrivent en peu de temps : les notifications individuelles sont suspendues pendant une heure.",
      "Toutes les demandes sont enregistrées. Consultez la liste dans l'administration :",
    ],
    adminUrl("/admin/leads"),
  );
}
