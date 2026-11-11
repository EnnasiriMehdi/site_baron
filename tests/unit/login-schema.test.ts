import { describe, expect, it } from "vitest";

import { loginSchema } from "@/features/admin-auth/schema";

describe("loginSchema", () => {
  it("normalise l'e-mail (espaces et casse)", () => {
    const result = loginSchema.parse({ email: "  Admin@Exemple.FR ", password: "x" });
    expect(result.email).toBe("admin@exemple.fr");
  });

  it("refuse un e-mail invalide", () => {
    const result = loginSchema.safeParse({ email: "pas-un-email", password: "x" });
    expect(result.success).toBe(false);
  });

  it("refuse un mot de passe vide", () => {
    const result = loginSchema.safeParse({ email: "a@b.fr", password: "" });
    expect(result.success).toBe(false);
  });

  it("n'impose pas de longueur minimale à la connexion", () => {
    const result = loginSchema.safeParse({ email: "a@b.fr", password: "abc" });
    expect(result.success).toBe(true);
  });
});
