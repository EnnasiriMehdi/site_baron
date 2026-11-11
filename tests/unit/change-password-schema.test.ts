import { describe, expect, it } from "vitest";

import { changePasswordSchema } from "@/features/admin-auth/schema";

const validInput = {
  currentPassword: "ancien-mot-de-passe",
  newPassword: "nouveau-mot-de-passe-long",
  confirmPassword: "nouveau-mot-de-passe-long",
};

describe("changePasswordSchema", () => {
  it("accepte une entrée valide", () => {
    expect(changePasswordSchema.safeParse(validInput).success).toBe(true);
  });

  it("refuse un mot de passe actuel vide", () => {
    const result = changePasswordSchema.safeParse({ ...validInput, currentPassword: "" });
    expect(result.success).toBe(false);
  });

  it("refuse un nouveau mot de passe trop court", () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      newPassword: "court1234",
      confirmPassword: "court1234",
    });
    expect(result.success).toBe(false);
  });

  it("refuse si la confirmation ne correspond pas", () => {
    const result = changePasswordSchema.safeParse({ ...validInput, confirmPassword: "autre-chose-de-long" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });
});
