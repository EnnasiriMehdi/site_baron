import "server-only";

import { after } from "next/server";

import { notificationService } from "@/features/notifications";
import { getEnv } from "@/lib/env";

import { EMAIL_CODE_TTL_MS } from "./email-code-service";
import type { EmailCodePurpose } from "./email-code-repository";

function logSendFailure(error: unknown): void {
  // Jamais l'adresse ni le code dans le log (CLAUDE.md, sections 8.4 et 9) : le nom de l'erreur seulement.
  console.error(
    `Échec de l'envoi d'un e-mail de récupération admin (${error instanceof Error ? error.name : "erreur inconnue"}).`,
  );
}

/*
 * Envoie après la réponse HTTP (after) : la requête ne dépend ni de la lenteur du SMTP, ni de
 * l'existence du compte — la durée de réponse ne trahit rien (CLAUDE.md, section 8.1).
 */
export function sendRecoveryCodeInBackground(
  recipientEmail: string,
  code: string,
  purpose: EmailCodePurpose,
): void {
  // Le mailer de développement n'affiche pas le contenu : sans ceci, le code serait introuvable en local.
  if (getEnv().NODE_ENV !== "production") {
    console.log(`[auth:dev] Code de récupération (${purpose}) : ${code}`);
  }

  after(async () => {
    try {
      await notificationService.sendAdminSecurityCode(recipientEmail, {
        code,
        purpose,
        validForMinutes: EMAIL_CODE_TTL_MS / 60000,
      });
    } catch (error) {
      logSendFailure(error);
    }
  });
}

// "mfa_locked" / "login_locked" : blocages (plafond 2FA, 5 mots de passe erronés), pas des récupérations.
export type SecurityAlertKind = EmailCodePurpose | "mfa_locked" | "login_locked";

export function sendSecurityAlertInBackground(recipientEmail: string, kind: SecurityAlertKind): void {
  after(async () => {
    try {
      await notificationService.sendAdminSecurityAlert(recipientEmail, { kind });
    } catch (error) {
      logSendFailure(error);
    }
  });
}
