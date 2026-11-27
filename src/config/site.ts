/*
 * Source unique des informations d'entreprise (NAP : nom, adresse, téléphone).
 * Les valeurs marquées TODO(contenu) doivent être fournies par le client, jamais inventées.
 */
export const siteConfig = {
  name: "Nova Chauffage",
  // Raison sociale (peut différer du nom commercial ci-dessus) et numéro SIRET : exigés en mentions
  // légales et utiles aux données structurées (CLAUDE.md, 7bis.2 et 5.2). Toutes les valeurs manquantes
  // ([<…>] ou TODO(contenu)) sont listées et expliquées dans TODO-CONTENU.md, à la racine du projet.
  legalName: "[<raison sociale, ou nom et prénom suivis de « EI »>]",
  siret: "[<numéro SIRET>]",
  tagline: "Chauffage, climatisation et plomberie — pour particuliers et professionnels.",
  description:
    "Dépannage chauffage, climatisation et plomberie, pour particuliers et professionnels : un technicien vous rappelle vite, avec un prix annoncé avant toute intervention.",
  url: "https://TODO(contenu)-domaine.fr",
  locale: "fr_FR",
  phone: {
    display: "07 68 66 34 33",
    href: "tel:+33768663433",
  },
  // Confirmés le 2026-10-08 sur la fiche Google Business de l'établissement (nom officiel
  // "Nova chauffage et climatisation", Chauffagiste, Montauroux) : ce n'est plus une supposition.
  email: "novachauffage@gmail.com",
  contactName: "Baron Behnam",
  // Adresse postale : la ville vient de la fiche Google (confirmée), le reste est à fournir.
  address: {
    street: "[<numéro et nom de rue>]",
    postalCode: "[<code postal>]",
    city: "Montauroux",
    country: "FR",
  },
  // Informations des pages légales (content/legal.ts). Les [<…>] sont à fournir par le client.
  legal: {
    form: "[<forme juridique : EI, SARL, SAS…>]",
    capital: "[<capital social, si société>]",
    rne: "[<numéro d'immatriculation au RNE>]",
    rcs: "[<numéro RCS et ville du greffe, le cas échéant>]",
    vatNumber: "[<numéro de TVA intracommunautaire, le cas échéant>]",
    publicationDirector: "[<nom du directeur de la publication>]",
    insurance: "[<assureur, adresse, numéro de contrat et zone couverte>]",
    host: {
      name: "[<nom de l'hébergeur>]",
      address: "[<adresse de l'hébergeur>]",
      phone: "[<téléphone de l'hébergeur>]",
      country: "[<pays d'hébergement>]",
    },
    mediator: {
      name: "[<nom du médiateur de la consommation>]",
      address: "[<adresse du médiateur>]",
      website: "[<site internet du médiateur>]",
    },
    maintenanceProvider: "[<prestataire de maintenance du site, le cas échéant>]",
    // Fournisseur de la boîte e-mail de l'entreprise (adresse `email` ci-dessus).
    emailProvider: "Google (Gmail)",
    emailTransfer: "[<transferts hors Union européenne liés à la messagerie et garanties appliquées>]",
    leadRetention: "[<durée de conservation des demandes>]",
    backupRetention: "[<durée de conservation des sauvegardes>]",
    serverLogs: "[<journaux du serveur : données enregistrées et durée de conservation>]",
    updatedAt: "[<date de mise à jour>]",
  },
  // Lien stable vers la fiche Google (vérifié en le rouvrant) : utilisé pour "voir tous les avis".
  googleReviewsUrl:
    "https://www.google.com/maps/place/Nova+chauffage+et+climatisation/@30.6959409,-49.8171262,13765254m/data=!3m2!1e3!4b1!4m6!3m5!1s0x6f398ce3a1c4d267:0xa12cf8cea1bf18c3!8m2!3d30.6959409!4d-49.8171262!16s%2Fg%2F11lyz0y0pc",
  areas: ["Cannes", "Antibes", "Nice"],
  services: [
    {
      slug: "chauffage",
      title: "Chauffage",
      summary: "Chaudière en panne, radiateur froid, entretien annuel.",
      points: [
        "Chaudière qui ne démarre plus ou qui chauffe mal",
        "Radiateurs froids, pression qui chute, bruits anormaux",
        "Entretien annuel (obligatoire pour certaines chaudières)",
      ],
    },
    {
      slug: "climatisation",
      title: "Climatisation",
      summary: "Installation, panne, entretien, pompe à chaleur.",
      points: [
        "Climatisation qui ne refroidit plus ou qui fuit",
        "Installation ou remplacement d'une climatisation réversible",
        "Entretien avant la saison chaude",
      ],
    },
    {
      slug: "plomberie",
      title: "Plomberie",
      summary: "Fuite, canalisation bouchée, chauffe-eau en panne.",
      points: [
        "Fuite d'eau, dégât des eaux, canalisation bouchée",
        "Chauffe-eau en panne ou qui fuit",
        "Recherche de fuite avant qu'elle n'aggrave les dégâts",
      ],
    },
  ],
} as const;
