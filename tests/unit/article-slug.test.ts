import { describe, expect, it } from "vitest";

import { slugify } from "@/features/articles/slug";

describe("slugify", () => {
  it("met en minuscules et remplace les espaces par des tirets", () => {
    expect(slugify("Fuite d'eau que faire")).toBe("fuite-d-eau-que-faire");
  });

  it("retire les accents", () => {
    expect(slugify("Chaudière électrique")).toBe("chaudiere-electrique");
  });

  it("supprime les tirets en bordure et ne répète jamais un tiret", () => {
    expect(slugify("  --Changer un ballon--  ")).toBe("changer-un-ballon");
  });
});
