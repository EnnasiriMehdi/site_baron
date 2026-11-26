import { createElement as createReactElement, type ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Field, Form, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";

// Rendu serveur (react-dom/server) : vérifie le HTML produit et les liens d'accessibilité, sans dépendance de test.
// Les effets (focus sur le premier champ invalide) ne s'exécutent pas ici : ils sont vérifiés à la main.
const noop = vi.fn();

// createElement assoupli : les `children` sont donnés en arguments, pas dans les props (typage de React).
const createElement = createReactElement as (type: unknown, props?: unknown, ...children: unknown[]) => ReactElement;

function emailForm(props: { fieldErrors?: Record<string, string[]>; error?: string; success?: string; hint?: string }) {
  return renderToString(
    createElement(
      Form,
      { action: noop, fieldErrors: props.fieldErrors, error: props.error, success: props.success },
      createElement(Field, { name: "email", label: "Adresse e-mail", hint: props.hint }, createElement(Input, { type: "email" })),
    ),
  );
}

function attr(html: string, tag: string, attribute: string): string | undefined {
  const element = new RegExp(`<${tag}\\b[^>]*>`).exec(html)?.[0];
  return element ? new RegExp(`\\b${attribute}="([^"]*)"`).exec(element)?.[1] : undefined;
}

describe("Form / Field / Input", () => {
  it("relie le label au champ et envoie le name du Field", () => {
    const html = emailForm({});

    const inputId = attr(html, "input", "id");
    expect(inputId).toBeTruthy();
    expect(attr(html, "label", "for")).toBe(inputId);
    expect(attr(html, "input", "name")).toBe("email");
    expect(html).toContain("Adresse e-mail");
  });

  it("sans erreur : champ valide, aucun message", () => {
    const html = emailForm({});

    expect(attr(html, "input", "aria-invalid")).toBe("false");
    expect(attr(html, "input", "aria-describedby")).toBeUndefined();
  });

  it("affiche le premier message d'erreur du champ et le relie au champ", () => {
    const html = emailForm({ fieldErrors: { email: ["Adresse invalide", "Autre"] } });

    expect(attr(html, "input", "aria-invalid")).toBe("true");
    const describedBy = attr(html, "input", "aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(html).toContain(`id="${describedBy}"`);
    expect(html).toContain("Adresse invalide");
    expect(html).not.toContain("Autre");
  });

  it("n'affiche pas l'erreur d'un autre champ", () => {
    const html = emailForm({ fieldErrors: { password: ["Requis"] } });

    expect(html).not.toContain("Requis");
    expect(attr(html, "input", "aria-invalid")).toBe("false");
  });

  it("affiche l'aide sans erreur, et la remplace par l'erreur quand il y en a une", () => {
    const withHint = emailForm({ hint: "Votre adresse pro." });
    expect(withHint).toContain("Votre adresse pro.");
    expect(attr(withHint, "input", "aria-describedby")).toBeTruthy();

    const withError = emailForm({ hint: "Votre adresse pro.", fieldErrors: { email: ["Invalide"] } });
    expect(withError).not.toContain("Votre adresse pro.");
    expect(withError).toContain("Invalide");
  });

  it("affiche l'erreur globale dans la zone d'alerte, qui existe même sans erreur", () => {
    const empty = emailForm({});
    expect(empty).toContain('role="alert"');

    expect(emailForm({ error: "Identifiants invalides." })).toContain("Identifiants invalides.");
  });

  it("remplace le formulaire par le contenu de succès", () => {
    const html = emailForm({ success: "Mot de passe mis à jour." });

    expect(html).toContain("Mot de passe mis à jour.");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<input");
  });

  it("gère aussi Textarea et Select avec les mêmes liens", () => {
    const html = renderToString(
      createElement(
        Form,
        { action: noop, fieldErrors: { subject: ["Requis"], message: ["Trop court"] } },
        createElement(Field, { name: "subject", label: "Objet" }, createElement(Select, null, createElement("option", null, "A"))),
        createElement(Field, { name: "message", label: "Message" }, createElement(Textarea)),
      ),
    );

    expect(attr(html, "select", "name")).toBe("subject");
    expect(attr(html, "select", "aria-invalid")).toBe("true");
    expect(attr(html, "textarea", "name")).toBe("message");
    expect(attr(html, "textarea", "aria-invalid")).toBe("true");
  });

  it("génère des ids différents pour deux champs", () => {
    const html = renderToString(
      createElement(
        Form,
        { action: noop },
        createElement(Field, { name: "a", label: "A" }, createElement(Input)),
        createElement(Field, { name: "b", label: "B" }, createElement(Input)),
      ),
    );

    const ids = [...html.matchAll(/<input\b[^>]*\bid="([^"]*)"/g)].map((match) => match[1]);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it("ajoute la className de l'appelant au style de base", () => {
    const html = renderToString(
      createElement(
        Form,
        { action: noop, className: "max-w-sm" },
        createElement(Field, { name: "a", label: "A" }, createElement(Input, { className: "uppercase" })),
      ),
    );

    expect(attr(html, "form", "class")).toContain("max-w-sm");
    expect(attr(html, "form", "class")).toContain("flex flex-col");
    expect(attr(html, "input", "class")).toContain("uppercase");
    expect(attr(html, "input", "class")).toContain("min-h-11");
  });
});

describe("verrouillage des composants hors de leur parent", () => {
  it("Input hors d'un Field lève une erreur claire", () => {
    expect(() => renderToString(createElement(Input))).toThrow("<Input> doit être placé dans un <Field>");
  });

  it("Field hors d'un Form lève une erreur claire", () => {
    expect(() => renderToString(createElement(Field, { name: "a", label: "A" }, null))).toThrow(
      "<Field> doit être placé dans un <Form>",
    );
  });
});

describe("SubmitButton", () => {
  it("affiche le libellé normal et n'est pas désactivé hors envoi", () => {
    const html = renderToString(
      createElement(Form, { action: noop, actions: createElement(SubmitButton, { pendingLabel: "En cours…" }, "Envoyer") }),
    );

    expect(html).toContain("Envoyer");
    expect(html).not.toContain("En cours…");
    expect(html).not.toMatch(/ disabled[=s>]/);
    expect(attr(html, "button", "type")).toBe("submit");
  });
});
