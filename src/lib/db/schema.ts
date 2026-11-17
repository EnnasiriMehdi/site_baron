import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin"] }).notNull().default("admin"),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  lockedUntil: integer("locked_until", { mode: "timestamp_ms" }),
  // Secret TOTP (base32). Présent dès le début de l'inscription au 2FA, mais le 2FA n'est actif
  // qu'une fois totpEnabledAt renseigné (code confirmé).
  totpSecret: text("totp_secret"),
  totpEnabledAt: integer("totp_enabled_at", { mode: "timestamp_ms" }),
  // Numéro de version des sessions : chaque jeton porte la version du moment de sa création ; l'incrémenter
  // (déconnexion, changement de mot de passe ou de 2FA) invalide d'un coup tous les jetons déjà émis.
  sessionVersion: integer("session_version").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type User = typeof users.$inferSelect;

export const recoveryCodes = sqliteTable("recovery_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(),
  usedAt: integer("used_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type RecoveryCode = typeof recoveryCodes.$inferSelect;

// Codes à usage unique envoyés par e-mail pour récupérer le compte admin (mot de passe oublié,
// téléphone perdu). Un seul code actif par (utilisateur, usage) : en émettre un remplace l'ancien.
export const emailCodes = sqliteTable("email_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  purpose: text("purpose", { enum: ["password_reset", "mfa_reset"] }).notNull(),
  // Haché comme un mot de passe (argon2) : un accès à la base ne révèle pas de code valide.
  codeHash: text("code_hash").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  usedAt: integer("used_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type EmailCode = typeof emailCodes.$inferSelect;

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  // new = jamais ouverte, read = ouverte par l'admin, done = traitée (marquée à la main). Colonne texte sans
  // contrainte SQL : ajouter "done" ne demande aucune migration.
  status: text("status", { enum: ["new", "read", "done"] }).notNull().default("new"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type Lead = typeof leads.$inferSelect;

export const leadAttachments = sqliteTable("lead_attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  // Nom d'origine conservé uniquement pour l'affichage ; jamais utilisé comme chemin de fichier.
  originalName: text("original_name").notNull(),
  // Chemin relatif sous data/uploads/, avec un nom de fichier généré (voir lib/uploads.ts).
  storedPath: text("stored_path").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type LeadAttachment = typeof leadAttachments.$inferSelect;

export const realisations = sqliteTable("realisations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  // Chemin public sous public/uploads/realisations/ (voir lib/public-image-upload.ts).
  photoPath: text("photo_path").notNull(),
  photoAlt: text("photo_alt").notNull(),
  // Slug de siteConfig.services, optionnel (pas de contrainte FK : les services sont en config, pas en base).
  relatedServiceSlug: text("related_service_slug"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type Realisation = typeof realisations.$inferSelect;

// Photos supplémentaires d'une réalisation (la photo principale reste sur `realisations` ci-dessus) :
// même pattern qu'un lead → plusieurs pièces jointes (`leadAttachments`), pour le carousel de la modal.
export const realisationPhotos = sqliteTable("realisation_photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  realisationId: integer("realisation_id")
    .notNull()
    .references(() => realisations.id, { onDelete: "cascade" }),
  photoPath: text("photo_path").notNull(),
  photoAlt: text("photo_alt").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type RealisationPhoto = typeof realisationPhotos.$inferSelect;

export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  // Markdown (jamais de HTML brut stocké, CLAUDE.md 7ter.2) ; rendu via lib/markdown.ts.
  body: text("body").notNull(),
  // Couverture nullable : obligatoire seulement à la publication, pas au brouillon (7ter.2).
  coverImagePath: text("cover_image_path"),
  coverImageAlt: text("cover_image_alt"),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  authorName: text("author_name").notNull(),
  relatedServiceSlug: text("related_service_slug"),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type Article = typeof articles.$inferSelect;
