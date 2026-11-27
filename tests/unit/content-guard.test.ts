import { describe, expect, it } from "vitest";

import { isPlaceholder } from "@/lib/content-guard";

describe("isPlaceholder", () => {
  it.each(["TODO(contenu) : raison sociale", "https://TODO(contenu)-domaine.fr", "[<numéro SIRET>]"])(
    "détecte le contenu manquant : %s",
    (value) => {
      expect(isPlaceholder(value)).toBe(true);
    },
  );

  it.each(["Montauroux", "07 68 66 34 33", ""])("laisse passer une vraie valeur : %s", (value) => {
    expect(isPlaceholder(value)).toBe(false);
  });
});
