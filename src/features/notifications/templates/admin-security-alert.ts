import { siteConfig } from "@/config/site";

import { escapeHtml } from "./escape-html";
import type { RenderedEmail } from "./contact-confirmation";

export type AdminSecurityAlertInput = {
  kind: "password_reset" | "mfa_reset";
};

const KIND_LABEL: Record<AdminSecurityAlertInput["kind"], string> = {
  password_reset: "Le mot de passe de l'administration a été réinitialisé",
  mfa_reset: "La double authentification de l'administration a été réinitialisée",
};

// Envoyée après une récupération réussie : si l'admin n'y est pour rien, il sait qu'il faut réagir.
export function buildAdminSecurityAlertEmail(input: AdminSecurityAlertInput): RenderedEmail {
  const subject = `${siteConfig.name} — Alerte de sécurité`;
  const headline = KIND_LABEL[input.kind];

  const text = [
    "Bonjour,",
    "",
    `${headline} via un code envoyé par e-mail.`,
    "Si c'est bien vous, aucune action n'est nécessaire.",
    "Sinon, sécurisez immédiatement votre boîte e-mail, puis changez votre mot de passe.",
    "",
    siteConfig.name,
  ].join("\n");

  const html = `
    <div style="font-family: sans-serif; color: #1a1a1a; line-height: 1.5;">
      <p>Bonjour,</p>
      <p>${escapeHtml(headline)} via un code envoyé par e-mail.</p>
      <p>Si c'est bien vous, aucune action n'est nécessaire.</p>
      <p>Sinon, sécurisez immédiatement votre boîte e-mail, puis changez votre mot de passe.</p>
      <p>${escapeHtml(siteConfig.name)}</p>
    </div>
  `.trim();

  return { subject, html, text };
}
