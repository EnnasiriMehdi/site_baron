import { siteConfig } from "@/config/site";

import { adminUrl, renderAdminNotice } from "./admin-notice";
import type { RenderedEmail } from "./contact-confirmation";

export type StorageWarningInput = {
  // Calculé par le serveur à partir de la taille des fichiers : un entier, jamais une valeur du visiteur.
  percent: number;
};

export function buildStorageWarningEmail(input: StorageWarningInput): RenderedEmail {
  const percent = Math.min(100, Math.max(0, Math.trunc(input.percent)));

  return renderAdminNotice(
    `${siteConfig.name} — Stockage des pièces jointes bientôt plein`,
    [
      `L'espace réservé aux pièces jointes des demandes est utilisé à ${percent} %.`,
      "À 100 %, les photos jointes sont refusées (le message texte, lui, est toujours accepté).",
      "Libérez de l'espace ou augmentez le quota. Le tableau de bord de l'administration affiche l'état en permanence :",
    ],
    adminUrl("/admin"),
  );
}
