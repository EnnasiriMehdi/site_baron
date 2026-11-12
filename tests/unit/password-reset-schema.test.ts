import { describe, expect, it } from "vitest";

import { passwordResetConfirmSchema, passwordResetRequestSchema } from "@/features/admin-auth/schema";

describe("passwordResetRequestSchema", () => {
  it("normalise l'adresse e-mail", () => {
    const parsed = passwordResetRequestSchema.parse({ email: "  Admin@Exemple.FR " });
    expect(parsed.email).toBe("admin@exemple.fr");
  });

  it("refuse une adresse invalide", () => {
    expect(passwordResetRequestSchema.safeParse({ email: "pas-un-email" }).success).toBe(false);
  });
});

describe("passwordResetConfirmSchema", () => {
  const valid = {
    email: "admin@exemple.fr",
    code: "ABCD-2345",
    newPassword: "un-mot-de-passe-long",
    confirmPassword: "un-mot-de-passe-long",
  };

  it("accepte une saisie valide", () => {
    expect(passwordResetConfirmSchema.safeParse(valid).success).toBe(true);
  });

  it("refuse un mot de passe de moins de 12 caractères", () => {
    const result = passwordResetConfirmSchema.safeParse({ ...valid, newPassword: "court", confirmPassword: "court" });
    expect(result.success).toBe(false);
  });

  it("refuse une confirmation différente", () => {
    const result = passwordResetConfirmSchema.safeParse({ ...valid, confirmPassword: "autre-mot-de-passe" });
    expect(result.success).toBe(false);
  });

  it("refuse un code vide", () => {
    expect(passwordResetConfirmSchema.safeParse({ ...valid, code: "  " }).success).toBe(false);
  });
});
