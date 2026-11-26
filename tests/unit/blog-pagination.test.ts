import { describe, expect, it } from "vitest";

import { ARTICLES_PER_PAGE, blogPageHref, blogTotalPages, parseBlogPage } from "@/features/articles/pagination";

describe("blogTotalPages", () => {
  it("compte au moins une page, même sans article", () => {
    expect(blogTotalPages(0)).toBe(1);
  });

  it("n'ouvre une nouvelle page qu'au-delà d'une page pleine", () => {
    expect(blogTotalPages(ARTICLES_PER_PAGE)).toBe(1);
    expect(blogTotalPages(ARTICLES_PER_PAGE + 1)).toBe(2);
  });
});

describe("parseBlogPage", () => {
  it("accepte les numéros existants", () => {
    expect(parseBlogPage("1", 3)).toBe(1);
    expect(parseBlogPage("3", 3)).toBe(3);
  });

  it.each(["0", "-1", "abc", "2.5", "2abc", "02", " 2", "", "1e3", "9999999"])("refuse « %s »", (raw) => {
    expect(parseBlogPage(raw, 10_000_000)).toBeNull();
  });

  it("refuse un numéro au-delà de la dernière page", () => {
    expect(parseBlogPage("4", 3)).toBeNull();
  });
});

describe("blogPageHref", () => {
  it("donne /blog pour la page 1, un segment de chemin ensuite", () => {
    expect(blogPageHref(1)).toBe("/blog");
    expect(blogPageHref(2)).toBe("/blog/page/2");
  });
});
