/*
 * FAQ publique (CLAUDE.md, section 5.4). Contenu éditorial uniquement, pas de logique.
 * Chaque réponse est dérivée de faits déjà confirmés ailleurs dans le site (steps, siteConfig) —
 * aucune réponse inventée. Si une question nécessite une info non confirmée, elle reste absente
 * d'ici tant que TODO-CONTENU.md n'est pas rempli, plutôt que d'afficher une réponse à moitié vraie.
 */
export const faq = [
  {
    question: "Comment se passe une intervention ?",
    answer:
      "Vous nous appelez et décrivez la panne. On vous rappelle avec un délai et un prix avant tout déplacement. Un technicien intervient ensuite, et la facture correspond exactement à ce qui a été annoncé.",
  },
  {
    question: "Le prix est-il annoncé avant les travaux ?",
    answer:
      "Oui, systématiquement. Le tarif est annoncé avant que le technicien ne commence : jamais de surprise sur la facture.",
  },
  {
    question: "Dans quelles villes intervenez-vous ?",
    answer:
      "Nous intervenons à Cannes, Antibes, Nice et dans les communes alentours. En cas de doute sur votre adresse, le plus rapide reste de nous appeler directement.",
  },
  {
    question: "Intervenez-vous uniquement en urgence, ou aussi pour l'installation et l'entretien ?",
    answer:
      "Les deux : dépannage en urgence, mais aussi installation et entretien en chauffage, climatisation et plomberie (chaudière, climatisation réversible, chauffe-eau, recherche de fuite...).",
  },
  {
    question: "Puis-je joindre des photos à ma demande ?",
    answer:
      "Oui, le formulaire de contact accepte jusqu'à 5 photos ou documents (5 Mo maximum par fichier) : ça aide le technicien à mieux préparer son intervention avant de se déplacer.",
  },
] as const;
