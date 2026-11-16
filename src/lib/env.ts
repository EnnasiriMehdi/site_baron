import "server-only";

import { z } from "zod";

/*
 * Seul module autorisé à lire process.env (CLAUDE.md, section 4).
 * La validation se fait au premier accès : une variable manquante ou trop faible arrête l'application.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET doit contenir au moins 32 caractères"),
  // Nom de fichier uniquement : le dossier data/ est fixe (cf. lib/db/index.ts) pour que le bundler
  // puisse analyser statiquement le chemin et ne pas tracer tout le projet.
  DATABASE_FILENAME: z
    .string()
    .min(1)
    .regex(/^[\w.-]+\.db$/, "Doit être un nom de fichier simple se terminant par .db")
    .default("site.db"),
  // SMTP Google (Gmail) pour les e-mails envoyés par l'application : codes et alertes de récupération
  // du compte admin (features/notifications). SMTP_USER/SMTP_PASSWORD restent optionnels ici pour ne jamais casser
  // le démarrage en développement (où le mailer console est utilisé, cf. lib/mailer) ; ils sont
  // vérifiés et exigés uniquement au moment de construire le mailer SMTP réel, en production.
  SMTP_HOST: z.string().min(1).default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_USER: z.string().trim().email("SMTP_USER doit être une adresse e-mail valide").optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      // Le message liste les noms de variables manquantes, jamais leurs valeurs.
      const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
      throw new Error(`Configuration invalide : ${fields}`);
    }
    cached = parsed.data;
  }
  return cached;
}
