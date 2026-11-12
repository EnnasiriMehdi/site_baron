import { describe, expect, it } from "vitest";

import { generateEmailCode, normalizeEmailCode } from "@/features/admin-auth/email-code";

describe("generateEmailCode", () => {
  it("produit le format XXXX-XXXX sans caractères ambigus", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateEmailCode()).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
    }
  });
});

describe("normalizeEmailCode", () => {
  it("met en majuscules et retire les espaces", () => {
    expect(normalizeEmailCode("  abcd-2345 ")).toBe("ABCD-2345");
  });

  it("remet le tiret s'il manque ou s'il est remplacé par un espace", () => {
    expect(normalizeEmailCode("abcd2345")).toBe("ABCD-2345");
    expect(normalizeEmailCode("abcd 2345")).toBe("ABCD-2345");
  });

  it("laisse une saisie de mauvaise longueur telle quelle (elle sera refusée à la vérification)", () => {
    expect(normalizeEmailCode("abc")).toBe("ABC");
  });
});
