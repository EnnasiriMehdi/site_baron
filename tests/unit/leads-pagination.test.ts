import { describe, expect, it } from "vitest";

import { LEADS_PAGE_SIZE, parsePage, totalPages } from "@/features/leads/pagination";

describe("totalPages", () => {
  it("compte au moins une page, même sans demande", () => {
    expect(totalPages(0)).toBe(1);
  });

  it("arrondit à la page supérieure", () => {
    expect(totalPages(LEADS_PAGE_SIZE)).toBe(1);
    expect(totalPages(LEADS_PAGE_SIZE + 1)).toBe(2);
    expect(totalPages(45, 20)).toBe(3);
  });
});

describe("parsePage (numéro venu de l'URL)", () => {
  it("lit un numéro valide", () => {
    expect(parsePage("2", 5)).toBe(2);
  });

  it("revient à la page 1 si la valeur est absente ou invalide", () => {
    expect(parsePage(undefined, 5)).toBe(1);
    expect(parsePage("abc", 5)).toBe(1);
    expect(parsePage("0", 5)).toBe(1);
    expect(parsePage("-3", 5)).toBe(1);
    expect(parsePage("2.5", 5)).toBe(1);
    expect(parsePage("1e3", 5)).toBe(1);
    expect(parsePage("", 5)).toBe(1);
  });

  it("reste sur la dernière page si le numéro la dépasse", () => {
    expect(parsePage("99", 3)).toBe(3);
    expect(parsePage("9999999999999999", 3)).toBe(1);
  });

  it("prend la première valeur si le paramètre est répété", () => {
    expect(parsePage(["2", "4"], 5)).toBe(2);
  });
});
