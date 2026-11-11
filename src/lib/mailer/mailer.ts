import "server-only";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

// Interface ciblée (DIP, CLAUDE.md section 4) : toute feature qui envoie un e-mail dépend de ceci,
// jamais directement de Nodemailer ou d'un SDK de fournisseur.
export interface Mailer {
  send(input: SendEmailInput): Promise<void>;
}
