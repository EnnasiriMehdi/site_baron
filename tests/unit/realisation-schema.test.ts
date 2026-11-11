import { describe, expect, it } from "vitest";

import { realisationSchema } from "@/features/realisations/schema";

const validInput = {
  title: "Remplacement chaudière à Cannes",
  description: "Remplacement complet d'une chaudière gaz vétuste par un modèle à condensation.",
  photoAlt: "Chaudière murale neuve installée dans un cellier",
  relatedServiceSlug: "chauffage",
};

describe("realisationSchema", () => {
  it("accepte une entrée valide", () => {
    expect(realisationSchema.safeParse(validInput).success).toBe(true);
  });

  it("refuse un titre vide", () => {
    expect(realisationSchema.safeParse({ ...validInput, title: "" }).success).toBe(false);
  });

  it("refuse un texte alternatif vide", () => {
    expect(realisationSchema.safeParse({ ...validInput, photoAlt: "" }).success).toBe(false);
  });

  it("refuse un service inconnu", () => {
    expect(realisationSchema.safeParse({ ...validInput, relatedServiceSlug: "menuiserie" }).success).toBe(false);
  });

  it("accepte l'absence de service lié", () => {
    const result = realisationSchema.safeParse({ ...validInput, relatedServiceSlug: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.relatedServiceSlug).toBeUndefined();
  });
});
