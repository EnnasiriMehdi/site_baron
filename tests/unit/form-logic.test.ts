import { describe, expect, it } from "vitest";

import {
  NO_FIELD_ERRORS,
  describedByIds,
  firstMessage,
  hasAnyError,
  mergeControlClass,
} from "@/components/ui/form/form-logic";

describe("firstMessage", () => {
  it("renvoie le premier message du champ", () => {
    expect(firstMessage({ email: ["Invalide", "Trop court"] }, "email")).toBe("Invalide");
  });

  it("renvoie undefined sans erreur, avec une liste vide ou un message vide", () => {
    expect(firstMessage({}, "email")).toBeUndefined();
    expect(firstMessage({ email: [] }, "email")).toBeUndefined();
    expect(firstMessage({ email: [""] }, "email")).toBeUndefined();
    expect(firstMessage({ email: undefined }, "email")).toBeUndefined();
  });

  it("ne confond pas deux champs", () => {
    expect(firstMessage({ password: ["Requis"] }, "email")).toBeUndefined();
  });
});

describe("hasAnyError", () => {
  it("est faux pour l'état initial", () => {
    expect(hasAnyError(NO_FIELD_ERRORS)).toBe(false);
    expect(hasAnyError({ email: [], password: undefined })).toBe(false);
  });

  it("est vrai dès qu'un champ a un message", () => {
    expect(hasAnyError({ email: [], password: ["Requis"] })).toBe(true);
  });
});

describe("describedByIds", () => {
  const ids = { errorId: "e", hintId: "h" };

  it("pointe sur l'erreur quand elle est affichée, même s'il y a une aide", () => {
    expect(describedByIds({ ...ids, hasError: true, hasHint: true })).toBe("e");
  });

  it("pointe sur l'aide sans erreur", () => {
    expect(describedByIds({ ...ids, hasError: false, hasHint: true })).toBe("h");
  });

  it("ne pointe sur rien sans erreur ni aide", () => {
    expect(describedByIds({ ...ids, hasError: false, hasHint: false })).toBeUndefined();
  });
});

describe("mergeControlClass", () => {
  const base = "mt-1 w-full text-base text-(--color-text)";

  it("sans classe de l'appelant, renvoie le style de base", () => {
    expect(mergeControlClass(base)).toBe(base);
  });

  it("ajoute les classes de l'appelant après celles de base", () => {
    expect(mergeControlClass(base, "uppercase")).toBe(`${base} uppercase`);
  });

  it("remplace la taille de texte de base quand l'appelant en impose une", () => {
    const merged = mergeControlClass(base, "text-center text-lg tracking-widest");

    expect(merged).toContain("text-lg");
    expect(merged).not.toContain("text-base");
  });

  it("garde la couleur et l'alignement du texte (ce ne sont pas des tailles)", () => {
    const merged = mergeControlClass(base, "text-center text-lg");

    expect(merged).toContain("text-(--color-text)");
    expect(merged).toContain("text-center");
  });

  it("garde la taille de base si l'appelant n'en impose pas", () => {
    expect(mergeControlClass(base, "text-center")).toContain("text-base");
  });
});
