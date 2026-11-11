import { z } from "zod";

import { siteConfig } from "@/config/site";

const serviceSlugs = siteConfig.services.map((service) => service.slug) as [string, ...string[]];

export const realisationSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(160, "Titre trop long"),
  description: z.string().trim().min(1, "Description requise").max(500, "Description trop longue (500 caractères max)"),
  photoAlt: z.string().trim().min(1, "Texte alternatif requis").max(160, "Texte alternatif trop long"),
  relatedServiceSlug: z
    .union([z.enum(serviceSlugs), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type RealisationInput = z.infer<typeof realisationSchema>;
