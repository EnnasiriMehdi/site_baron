import { describe, expect, it } from "vitest";

import { renderArticleBody } from "@/lib/markdown";

describe("renderArticleBody", () => {
  it("échappe une balise <script> au lieu de l'interpréter", () => {
    const html = renderArticleBody("<script>alert(1)</script>");
    expect(html).not.toContain("<script");
  });

  it("échappe un attribut on* tapé en HTML brut (balise rendue comme texte inerte, jamais interprétée)", () => {
    const html = renderArticleBody('<img src="x" onerror="alert(1)">');
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("refuse un lien en javascript: (jamais rendu comme <a href>)", () => {
    const html = renderArticleBody("[cliquez ici](javascript:alert(1))");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain('href="javascript:');
  });

  it("refuse une image en javascript: (jamais rendue comme <img src>)", () => {
    const html = renderArticleBody("![alt](javascript:alert(1))");
    expect(html).not.toContain("<img");
    expect(html).not.toContain('src="javascript:');
  });

  it("rend normalement une image insérée par l'éditeur", () => {
    const html = renderArticleBody("![Chaudière installée](/uploads/articles/photo.jpg)");
    expect(html).toContain('src="/uploads/articles/photo.jpg"');
    expect(html).toContain('alt="Chaudière installée"');
  });
});
