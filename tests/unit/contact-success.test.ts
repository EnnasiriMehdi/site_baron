import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";
import { ContactSuccess } from "@/features/contact/components/ContactSuccess";

/*
 * Aucun e-mail n'est envoyé au visiteur : cet écran est son seul retour. On vérifie ce qu'il contient.
 * (Le focus automatique est un effet de navigateur : il se vérifie à la main ou en test E2E.)
 */
describe("ContactSuccess", () => {
  const html = renderToStaticMarkup(createElement(ContactSuccess));

  it("annonce clairement que la demande est envoyée", () => {
    expect(html).toContain("Votre demande a bien été envoyée.");
  });

  it("est annoncé aux lecteurs d'écran et peut recevoir le focus", () => {
    expect(html).toContain('role="status"');
    expect(html).toContain('tabindex="-1"');
  });

  it("rappelle le numéro de téléphone avec un lien cliquable", () => {
    expect(html).toContain(`href="${siteConfig.phone.href}"`);
    expect(html).toContain(siteConfig.phone.display);
  });

  it("ne promet aucun e-mail automatique de confirmation", () => {
    expect(html).not.toMatch(/e-mail de confirmation|vous recevrez/i);
  });
});
