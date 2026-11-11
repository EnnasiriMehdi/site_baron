import { z } from "zod";

import { siteConfig } from "@/config/site";
import type { Article } from "@/lib/db/schema";

const serviceSlugs = siteConfig.services.map((service) => service.slug) as [string, ...string[]];

export const articleSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(60, "Titre trop long (60 caractères max)"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug requis")
    .regex(/^[a-z0-9-]+$/, "Le slug ne peut contenir que des minuscules, chiffres et tirets"),
  description: z.string().trim().min(1, "Description requise").max(155, "Description trop longue (155 caractères max)"),
  body: z.string().trim().min(1, "Le corps de l'article ne peut pas être vide"),
  authorName: z.string().trim().min(1, "Auteur requis").max(160, "Nom d'auteur trop long"),
  relatedServiceSlug: z
    .union([z.enum(serviceSlugs), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type ArticleInput = z.infer<typeof articleSchema>;

// "Refus de publier sans alt" (CLAUDE.md, 7ter.2) : vérifié uniquement au moment de publier,
// jamais au moment d'enregistrer un brouillon (qui peut rester incomplet).
export function isReadyToPublish(article: Pick<Article, "coverImagePath" | "coverImageAlt">): boolean {
  return Boolean(article.coverImagePath) && Boolean(article.coverImageAlt);
}
