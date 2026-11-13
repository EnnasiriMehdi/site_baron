import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getEnv: () => ({ SESSION_SECRET: "secret-de-test-assez-long-pour-hs256-0123456789" }),
}));

import { createFormToken, MIN_FILL_SECONDS, verifyFormToken } from "@/features/contact/form-token";

const HOUR_MS = 60 * 60 * 1000;

describe("jeton du formulaire de contact", () => {
  it("accepte un jeton après le délai minimum de remplissage", async () => {
    const token = await createFormToken();

    expect(await verifyFormToken(token, Date.now() + (MIN_FILL_SECONDS + 1) * 1000)).toBe(true);
  });

  it("refuse un envoi instantané (script)", async () => {
    const token = await createFormToken();

    expect(await verifyFormToken(token, Date.now())).toBe(false);
  });

  it("refuse un jeton expiré (plus d'1 h)", async () => {
    const token = await createFormToken();

    expect(await verifyFormToken(token, Date.now() + HOUR_MS + 60_000)).toBe(false);
  });

  it("refuse l'absence de jeton, un jeton vide ou inventé", async () => {
    const later = Date.now() + 10_000;

    expect(await verifyFormToken(undefined, later)).toBe(false);
    expect(await verifyFormToken(null, later)).toBe(false);
    expect(await verifyFormToken("", later)).toBe(false);
    expect(await verifyFormToken("abc.def.ghi", later)).toBe(false);
  });

  it("refuse un jeton dont le contenu a été modifié", async () => {
    const token = await createFormToken();
    const [header, payload, signature] = token.split(".");
    const tampered = `${header}.${payload}x.${signature}`;

    expect(await verifyFormToken(tampered, Date.now() + 10_000)).toBe(false);
  });
});
