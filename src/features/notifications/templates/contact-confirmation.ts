import { siteConfig } from "@/config/site";

import { escapeHtml } from "./escape-html";

export type ContactConfirmationInput = {
  recipientEmail: string;
  recipientName: string;
  subject: string;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

// Rendu serveur avec version texte (CLAUDE.md, section 9). Entrées utilisateur échappées avant
// insertion dans le HTML (même règle que dangerouslySetInnerHTML, section 8.2).
export function buildContactConfirmationEmail(input: ContactConfirmationInput): RenderedEmail {
  const subject = `${siteConfig.name} — Nous avons bien reçu votre demande`;

  const text = [
    `Bonjour ${input.recipientName},`,
    "",
    `Nous avons bien reçu votre demande concernant « ${input.subject} ».`,
    "Un technicien vous recontacte rapidement pour vous indiquer le délai et le prix avant toute intervention.",
    "",
    `En cas d'urgence, vous pouvez nous appeler directement au ${siteConfig.phone.display}.`,
    "",
    siteConfig.name,
  ].join("\n");

  const html = `
    <div style="font-family: sans-serif; color: #1a1a1a; line-height: 1.5;">
      <p>Bonjour ${escapeHtml(input.recipientName)},</p>
      <p>Nous avons bien reçu votre demande concernant « ${escapeHtml(input.subject)} ».</p>
      <p>Un technicien vous recontacte rapidement pour vous indiquer le délai et le prix avant toute intervention.</p>
      <p>
        En cas d'urgence, vous pouvez nous appeler directement au
        <a href="${siteConfig.phone.href}">${escapeHtml(siteConfig.phone.display)}</a>.
      </p>
      <p>${escapeHtml(siteConfig.name)}</p>
    </div>
  `.trim();

  return { subject, html, text };
}
