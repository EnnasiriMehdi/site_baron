import "server-only";

import nodemailer from "nodemailer";

import { siteConfig } from "@/config/site";
import type { Mailer, SendEmailInput } from "./mailer";

type SmtpCredentials = {
  host: string;
  port: number;
  user: string;
  password: string;
};

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Échecs d'envoi : retry borné avec backoff, puis l'appelant journalise (CLAUDE.md, section 9).
export function createSmtpMailer(credentials: SmtpCredentials): Mailer {
  const transporter = nodemailer.createTransport({
    host: credentials.host,
    port: credentials.port,
    secure: credentials.port === 465,
    auth: { user: credentials.user, pass: credentials.password },
  });

  return {
    async send(input: SendEmailInput): Promise<void> {
      let lastError: unknown;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
          await transporter.sendMail({
            from: `"${siteConfig.name}" <${credentials.user}>`,
            to: input.to,
            subject: input.subject,
            html: input.html,
            text: input.text,
          });
          return;
        } catch (error) {
          lastError = error;
          if (attempt < MAX_ATTEMPTS) {
            await wait(RETRY_DELAY_MS * attempt);
          }
        }
      }
      throw lastError;
    },
  };
}
