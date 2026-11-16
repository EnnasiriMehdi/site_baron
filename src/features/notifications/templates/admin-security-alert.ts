import { siteConfig } from "@/config/site";

import { escapeHtml } from "./escape-html";
import type { RenderedEmail } from "./contact-confirmation";

export type AdminSecurityAlertInput = {
  kind: "password_reset" | "mfa_reset" | "mfa_locked" | "login_locked";
};

type AlertContent = { headline: string; details: string[] };

const AFTER_RECOVERY_DETAILS = [
  "Si c'est bien vous, aucune action n'est nécessaire.",
  "Sinon, sécurisez immédiatement votre boîte e-mail, puis changez votre mot de passe.",
];

const CONTENT: Record<AdminSecurityAlertInput["kind"], AlertContent> = {
  password_reset: {
    headline: "Le mot de passe de l'administration a été réinitialisé via un code envoyé par e-mail.",
    details: AFTER_RECOVERY_DETAILS,
  },
  mfa_reset: {
    headline: "La double authentification de l'administration a été réinitialisée via un code envoyé par e-mail.",
    details: AFTER_RECOVERY_DETAILS,
  },
  login_locked: {
    headline: "Plusieurs mots de passe erronés ont été saisis pour l'administration : la connexion est bloquée temporairement.",
    details: [
      "Si c'est vous, patientez quelques minutes avant de réessayer.",
      "Sinon, quelqu'un essaie de se connecter à l'administration. Aucune action n'est nécessaire si votre mot de passe est long et unique ; dans le doute, changez-le.",
      "Cette alerte n'est envoyée qu'une fois par jour, même si les tentatives continuent.",
    ],
  },
  mfa_locked: {
    headline: "Plusieurs codes de double authentification erronés ont été saisis pour l'administration.",
    details: [
      "La vérification des codes est suspendue (jusqu'à 24 heures).",
      "Si ce n'est pas vous, quelqu'un connaît votre mot de passe : changez-le dès que possible.",
      "Pour vous connecter avant la fin du délai, utilisez la récupération par e-mail proposée à l'étape du code.",
    ],
  },
};

// Envoyée après une récupération réussie ou un blocage : si l'admin n'y est pour rien, il sait qu'il faut réagir.
export function buildAdminSecurityAlertEmail(input: AdminSecurityAlertInput): RenderedEmail {
  const subject = `${siteConfig.name} — Alerte de sécurité`;
  const { headline, details } = CONTENT[input.kind];

  const text = ["Bonjour,", "", headline, ...details, "", siteConfig.name].join("\n");

  const html = `
    <div style="font-family: sans-serif; color: #1a1a1a; line-height: 1.5;">
      <p>Bonjour,</p>
      <p>${escapeHtml(headline)}</p>
      ${details.map((line) => `<p>${escapeHtml(line)}</p>`).join("\n      ")}
      <p>${escapeHtml(siteConfig.name)}</p>
    </div>
  `.trim();

  return { subject, html, text };
}
