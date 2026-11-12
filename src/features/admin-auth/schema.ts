import { z } from "zod";

// Pas de règle de longueur minimale ici : elle s'applique à la création du mot de passe, pas à la connexion.
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Adresse e-mail requise")
    .max(254, "Adresse e-mail trop longue")
    .email("Adresse e-mail invalide"),
  password: z
    .string()
    .min(1, "Mot de passe requis")
    .max(512, "Mot de passe trop long"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Un code TOTP (6 chiffres) ou un code de secours ("XXXXX-XXXXX") : la distinction se fait à la vérification.
export const secondFactorCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, "Code requis")
  .max(32, "Code invalide");

export type SecondFactorCodeInput = z.infer<typeof secondFactorCodeSchema>;

// Même convention que scripts/create-admin.ts (seul autre endroit où un mot de passe est créé).
const MIN_PASSWORD_LENGTH = 12;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis").max(512),
    newPassword: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`)
      .max(512),
    confirmPassword: z.string().min(1, "Confirmation requise").max(512),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Code reçu par e-mail ("XXXX-XXXX") : normalisé plus tard par normalizeEmailCode.
export const emailCodeSchema = z.string().trim().min(1, "Code requis").max(32, "Code invalide");

export const passwordResetRequestSchema = z.object({
  email: loginSchema.shape.email,
});

export const passwordResetConfirmSchema = z
  .object({
    email: loginSchema.shape.email,
    code: emailCodeSchema,
    newPassword: changePasswordSchema.shape.newPassword,
    confirmPassword: z.string().min(1, "Confirmation requise").max(512),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });
