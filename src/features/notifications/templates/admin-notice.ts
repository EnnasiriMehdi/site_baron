import { siteConfig } from "@/config/site";

import { escapeHtml } from "./escape-html";
import type { RenderedEmail } from "./contact-confirmation";

// Lien vers l'administration : base = config du site, chemin fixé par le code (jamais une valeur du visiteur).
export function adminUrl(path: string): string {
  return `${siteConfig.url.replace(/\/+$/, "")}${path}`;
}

// Squelette commun aux e-mails d'information adressés à l'admin (texte + HTML, valeurs échappées).
export function renderAdminNotice(subject: string, lines: string[], link: string): RenderedEmail {
  const text = ["Bonjour,", "", ...lines, "", link, "", siteConfig.name].join("\n");

  const html = `
    <div style="font-family: sans-serif; color: #1a1a1a; line-height: 1.5;">
      <p>Bonjour,</p>
      ${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("\n      ")}
      <p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>
      <p>${escapeHtml(siteConfig.name)}</p>
    </div>
  `.trim();

  return { subject, html, text };
}
