import "server-only";

import { getEnv } from "@/lib/env";
import { createConsoleMailer } from "./console-mailer";
import { createSmtpMailer } from "./smtp-mailer";
import type { Mailer } from "./mailer";

let cached: Mailer | undefined;

// Composition root : SMTP Gmail réel en production, capture locale sinon (section 9).
export function getMailer(): Mailer {
  if (!cached) {
    const env = getEnv();
    if (env.NODE_ENV === "production") {
      if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
        throw new Error("Configuration invalide : SMTP_USER, SMTP_PASSWORD");
      }
      cached = createSmtpMailer({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        password: env.SMTP_PASSWORD,
      });
    } else {
      cached = createConsoleMailer();
    }
  }
  return cached;
}

export type { Mailer, SendEmailInput } from "./mailer";
