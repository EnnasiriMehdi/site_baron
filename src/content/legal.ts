/*
 * Textes des mentions légales, de la politique de confidentialité et de la mention du formulaire de contact.
 * Ils décrivent ce que le code fait réellement : à mettre à jour si une donnée collectée, un cookie, un
 * prestataire ou une durée change. Les informations d'entreprise viennent de config/site.ts.
 */
import { siteConfig } from "@/config/site";

export type LegalSection = {
  title: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
  link?: { href: string; label: string };
};

export type LegalDocument = {
  title: string;
  updatedAt: string;
  sections: readonly LegalSection[];
};

const { name, legalName, siret, address, phone, email, legal } = siteConfig;
const postalAddress = `${address.street}, ${address.postalCode} ${address.city}`;

export const legalNotice: LegalDocument = {
  title: "Mentions légales",
  updatedAt: legal.updatedAt,
  sections: [
    {
      title: "Éditeur du site",
      items: [
        `Nom commercial : ${name}`,
        `Raison sociale : ${legalName}`,
        `Forme juridique : ${legal.form}`,
        `Capital social : ${legal.capital}`,
        `Adresse : ${postalAddress}`,
        `Téléphone : ${phone.display}`,
        `E-mail : ${email}`,
      ],
    },
    {
      title: "Immatriculation",
      items: [
        `SIRET : ${siret}`,
        `Registre national des entreprises (RNE) : ${legal.rne}`,
        `Registre du commerce et des sociétés (RCS) : ${legal.rcs}`,
        `TVA intracommunautaire : ${legal.vatNumber}`,
      ],
    },
    { title: "Directeur de la publication", paragraphs: [legal.publicationDirector] },
    {
      title: "Hébergeur",
      items: [`Nom : ${legal.host.name}`, `Adresse : ${legal.host.address}`, `Téléphone : ${legal.host.phone}`],
    },
    { title: "Assurance professionnelle", paragraphs: [legal.insurance] },
    {
      title: "Médiation de la consommation",
      paragraphs: [
        "En cas de litige, et après une réclamation écrite adressée à l'entreprise, tout consommateur peut recourir gratuitement à un médiateur de la consommation (articles L612-1 et suivants du Code de la consommation).",
      ],
      items: [
        `Médiateur : ${legal.mediator.name}`,
        `Adresse : ${legal.mediator.address}`,
        `Site internet : ${legal.mediator.website}`,
      ],
    },
    {
      title: "Données personnelles",
      paragraphs: ["L'utilisation de vos données est décrite dans la politique de confidentialité."],
      link: { href: "/politique-de-confidentialite", label: "Lire la politique de confidentialité" },
    },
  ],
};

export const privacyPolicy: LegalDocument = {
  title: "Politique de confidentialité",
  updatedAt: legal.updatedAt,
  sections: [
    {
      title: "Responsable du traitement",
      paragraphs: [`${legalName} (${name}), ${postalAddress}.`, `Contact : ${email} ou ${phone.display}.`],
    },
    {
      title: "Données collectées par le formulaire de contact",
      paragraphs: [
        "Tous les champs sont obligatoires, sauf les pièces jointes : sans eux, la demande ne peut pas être envoyée.",
      ],
      items: [
        "Nom et prénom",
        "Numéro de téléphone",
        "Adresse e-mail",
        "Objet et message",
        "Photos jointes (facultatif). Elles peuvent contenir des informations techniques, dont le lieu de prise de vue.",
      ],
    },
    {
      title: "Données techniques",
      paragraphs: [
        "Pour bloquer les envois abusifs, votre adresse IP est utilisée au moment de l'envoi. Elle reste dans la mémoire du serveur, n'est pas enregistrée dans la base de données et disparaît au plus tard au redémarrage de l'application.",
        legal.serverLogs,
      ],
    },
    {
      title: "Finalités et bases légales",
      items: [
        "Répondre à votre demande (devis, intervention, question) : mesures précontractuelles prises à votre demande (article 6.1.b du RGPD).",
        "Protéger le site contre les abus : intérêt légitime de l'entreprise (article 6.1.f du RGPD).",
        "Aucune décision automatisée ni profilage n'est effectué.",
      ],
    },
    {
      title: "Destinataires",
      paragraphs: [`Les données du site sont hébergées en ${legal.host.country}.`, legal.emailTransfer],
      items: [
        `Les personnes habilitées de ${legalName}`,
        `L'hébergeur du site : ${legal.host.name}`,
        legal.maintenanceProvider,
        `Le fournisseur de la messagerie de l'entreprise, ${legal.emailProvider}, pour les messages envoyés directement à ${email}`,
      ],
    },
    {
      title: "Durée de conservation",
      paragraphs: [
        "Les documents liés à une prestation facturée sont conservés pendant la durée imposée par la loi.",
      ],
      items: [`Demandes et pièces jointes : ${legal.leadRetention}`, `Sauvegardes : ${legal.backupRetention}`],
    },
    {
      title: "Vos droits",
      paragraphs: [
        "Vous pouvez demander l'accès à vos données, leur rectification, leur effacement, la limitation de leur traitement et leur portabilité. Vous pouvez vous opposer aux traitements fondés sur l'intérêt légitime, et définir des directives sur le sort de vos données après votre décès.",
        `Écrivez à ${email} ou à l'adresse postale ci-dessus. Une réponse vous est apportée sous un mois, délai qui peut être prolongé dans les cas prévus par le RGPD.`,
        "Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL.",
      ],
      link: { href: "https://www.cnil.fr", label: "Site de la CNIL" },
    },
    {
      title: "Cookies",
      paragraphs: [
        "Ce site ne dépose aucun cookie sur l'appareil des visiteurs et n'utilise ni mesure d'audience ni publicité.",
        "Seul l'espace d'administration, réservé à l'entreprise, utilise des cookies de connexion strictement nécessaires.",
      ],
    },
  ],
};

// Affichée sous le formulaire de contact (information au moment de la collecte, article 13 du RGPD).
export const contactPrivacyNotice = `Tous les champs sont obligatoires, sauf les pièces jointes. ${legalName} utilise ces informations pour répondre à votre demande et les conserve pendant ${legal.leadRetention}. Pour y accéder, les corriger ou les supprimer : ${email}.`;
