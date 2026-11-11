/*
 * Contenus éditoriaux de la page d'accueil. Données uniquement, pas de logique (CLAUDE.md, section 3.1).
 * Chaque affirmation vérifiable qui n'est pas encore confirmée par le client reste marquée TODO(contenu).
 */

// Bandeau de repères sous le hero : rappels courts, vrais, pas de chiffre inventé.
export const heroHighlights = [
  "Devis clair avant travaux",
  "TODO(contenu) : délai de réponse",
  "Cannes · Antibes · Nice",
  "Un seul interlocuteur",
] as const;

// Reconnaissance du problème (CLAUDE.md, 7bis.3) : le visiteur doit se reconnaître dès le titre.
export const situations = [
  {
    title: "C'est urgent",
    description:
      "Panne de chauffage en plein froid, fuite qui inonde, climatisation qui ne répond plus : on vous rappelle en priorité.",
    anchor: "#contact",
    ctaLabel: "Appeler maintenant",
  },
  {
    title: "Ça recommence",
    description:
      "Une panne qui revient souvent cache en général un problème plus profond. On cherche la cause, pas seulement le symptôme.",
    anchor: "#services",
    ctaLabel: "Voir les interventions",
  },
  {
    title: "Il faut remplacer",
    description:
      "Chaudière, chauffe-eau ou climatisation vieillissante : on vous propose une solution adaptée, prix annoncé avant travaux.",
    anchor: "#services",
    ctaLabel: "Voir les interventions",
  },
  {
    title: "Autant prévenir",
    description: "Un entretien régulier coûte toujours moins cher qu'une panne un dimanche soir.",
    anchor: "#contact",
    ctaLabel: "Demander un rendez-vous",
  },
] as const;

// Réduction de l'incertitude (CLAUDE.md, 7bis.3) : dire ce qui se passe après l'appel.
export const steps = [
  {
    title: "Vous appelez",
    description: "Vous décrivez la panne. On prend les informations essentielles pour envoyer la bonne personne.",
  },
  {
    title: "On vous rappelle avec un prix",
    description: "Avant toute intervention, le délai estimé et le tarif vous sont annoncés clairement.",
  },
  {
    title: "On intervient",
    description: "Un technicien se déplace et répare. La facture correspond exactement à ce qui a été annoncé.",
  },
] as const;

/*
 * Avis clients : jamais de contenu inventé (CLAUDE.md, 7bis.4 — interdiction absolue des faux avis).
 * Ceux-ci sont réels, copiés tels quels depuis la fiche Google de l'établissement ("Nova chauffage
 * et climatisation", Montauroux) le 2026-10-08. Pas de ville de l'avis affichée : Google ne la fournit
 * pas sur ces avis, donc on n'en invente pas.
 */
export const googleReviews = {
  rating: "5,0",
  reviewCount: "3",
  reviews: [
    {
      quote: "Travail de qualité, passionné pas son métier je recommande !",
      author: "Elowen",
      visited: "Visité en avril 2025",
    },
    {
      quote:
        "Nova chauffage est intervenu chez nous pour refaire notre salle de bain ainsi que la pose d'une clim réversible. Le travail est professionnel, rapide et efficace ! Je recommande les yeux fermés cet artisan 🙏",
      author: "Thomas Debret",
      visited: "Visité en décembre 2024",
    },
    {
      quote:
        "Professionnel, sympathique et orienté client, c'est avec plaisir que je recommande Nova pour l'installation de climatisation",
      author: "La Maison du Nettoyage",
      visited: "Visité en juillet",
    },
  ],
} as const;

// Arguments de confiance (CLAUDE.md, 7bis.2) : chaque chiffre non confirmé reste un TODO(contenu) explicite.
export const trustPoints = [
  {
    title: "Un prix avant l'intervention",
    description: "Jamais de surprise sur la facture : le tarif est annoncé avant que le technicien ne commence.",
  },
  {
    title: "TODO(contenu) : années d'expérience locale",
    description: "À compléter avec l'ancienneté réelle de l'entreprise, si elle sert l'argument.",
  },
  {
    title: "TODO(contenu) : délai de rappel garanti",
    description: "À compléter avec un délai réellement tenu (ex. « réponse sous 1 h ») une fois mesuré.",
  },
  {
    title: "TODO(contenu) : assurance et certifications",
    description: "SIRET, assurance décennale, certifications (RGE, Qualibat...) à afficher si le client les détient.",
  },
] as const;
