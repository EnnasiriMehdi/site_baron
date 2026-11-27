import { siteConfig } from "@/config/site";

import { escapeHtml } from "./escape-html";
import type { RenderedEmail } from "./rendered-email";

export type AdminSecurityCodeInput = {
  code: string;
  purpose: "password_reset" | "mfa_reset";
  validForMinutes: number;
};

const PURPOSE_LABEL: Record<AdminSecurityCodeInput["purpose"], string> = {
  password_reset: "réinitialiser votre mot de passe",
  mfa_reset: "réinitialiser la double authentification",
};

// Aucun contenu libre fourni par un tiers : seul le code (alphabet fixe) et des textes constants.
export function buildAdminSecurityCodeEmail(input: AdminSecurityCodeInput): RenderedEmail {
  const subject = `${siteConfig.name} — Votre code de vérification`;
  const action = PURPOSE_LABEL[input.purpose];

  const text = [
    "Bonjour,",
    "",
    `Voici votre code pour ${action} sur l'administration du site :`,
    "",
    input.code,
    "",
    `Il est valable ${input.validForMinutes} minutes et ne fonctionne qu'une fois.`,
    "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message et changez votre mot de passe.",
    "",
    siteConfig.name,
  ].join("\n");

  const html = `
    <div style="font-family: sans-serif; color: #1a1a1a; line-height: 1.5;">
      <p>Bonjour,</p>
      <p>Voici votre code pour ${escapeHtml(action)} sur l'administration du site :</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${escapeHtml(input.code)}</p>
      <p>Il est valable ${input.validForMinutes} minutes et ne fonctionne qu'une fois.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message et changez votre mot de passe.</p>
      <p>${escapeHtml(siteConfig.name)}</p>
    </div>
  `.trim();

  return { subject, html, text };
}
