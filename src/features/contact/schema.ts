import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(160, "Nom trop long"),
  phone: z
    .string()
    .trim()
    .min(6, "Numéro de téléphone invalide")
    .max(20, "Numéro de téléphone invalide")
    .regex(/^[\d+().\s-]+$/, "Numéro de téléphone invalide"),
  email: z.string().trim().toLowerCase().min(1, "E-mail requis").max(254).email("E-mail invalide"),
  subject: z.string().trim().min(1, "Objet requis").max(120, "Objet trop long"),
  message: z.string().trim().min(1, "Message requis").max(4000, "Message trop long (4000 caractères max)"),
});

export type ContactInput = z.infer<typeof contactSchema>;
