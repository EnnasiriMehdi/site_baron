import { describe, expect, it } from "vitest";

import { articleSchema, isReadyToPublish } from "@/features/articles/schema";

const validInput = {
  title: "Fuite d'eau : que faire ?",
  slug: "fuite-eau-que-faire",
  description: "Les bons réflexes en cas de fuite d'eau, avant l'arrivée du technicien.",
  body: "## Coupez l'eau\n\nFermez le robinet d'arrêt général.",
  authorName: "Baron Behnam",
  relatedServiceSlug: "plomberie",
};

describe("articleSchema", () => {
  it("accepte une entrée valide", () => {
    expect(articleSchema.safeParse(validInput).success).toBe(true);
  });

  it("refuse un titre de plus de 60 caractères", () => {
    const result = articleSchema.safeParse({ ...validInput, title: "a".repeat(61) });
    expect(result.success).toBe(false);
  });

  it("refuse une description de plus de 155 caractères", () => {
    const result = articleSchema.safeParse({ ...validInput, description: "a".repeat(156) });
    expect(result.success).toBe(false);
  });

  it("refuse un slug avec majuscules ou espaces", () => {
    const result = articleSchema.safeParse({ ...validInput, slug: "Fuite Eau" });
    expect(result.success).toBe(false);
  });

  it("refuse un corps vide", () => {
    const result = articleSchema.safeParse({ ...validInput, body: "   " });
    expect(result.success).toBe(false);
  });

  it("accepte l'absence de service lié", () => {
    const result = articleSchema.safeParse({ ...validInput, relatedServiceSlug: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.relatedServiceSlug).toBeUndefined();
  });
});

describe("isReadyToPublish", () => {
  it("refuse sans photo de couverture", () => {
    expect(isReadyToPublish({ coverImagePath: null, coverImageAlt: null })).toBe(false);
  });

  it("refuse une photo sans texte alternatif", () => {
    expect(isReadyToPublish({ coverImagePath: "/uploads/articles/x.jpg", coverImageAlt: null })).toBe(false);
  });

  it("accepte avec photo et texte alternatif", () => {
    expect(isReadyToPublish({ coverImagePath: "/uploads/articles/x.jpg", coverImageAlt: "Une chaudière" })).toBe(true);
  });
});
