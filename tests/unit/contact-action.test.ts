import { beforeEach, describe, expect, it, vi } from "vitest";

// Valeurs lues par les doubles ci-dessous (vi.mock est hissé avant les imports).
const mocks = vi.hoisted(() => ({ ip: "203.0.113.1", submit: vi.fn() }));

vi.mock("@/lib/client-ip", () => ({ clientIp: async () => mocks.ip }));
vi.mock("@/features/contact/contact-instance", () => ({ contactService: { submit: mocks.submit } }));

import { submitContactAction } from "@/features/contact/actions";
import { siteConfig } from "@/config/site";

let ipCounter = 0;

function validForm(overrides: Record<string, string | File> = {}): FormData {
  const form = new FormData();
  const fields: Record<string, string | File> = {
    name: "  Marie Dupont ",
    phone: "06 12 34 56 78",
    email: "Marie@Exemple.fr",
    subject: "Panne de chaudière",
    message: "La chaudière ne démarre plus.",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return form;
}

beforeEach(() => {
  // Une adresse IP différente par test : le limiteur de débit garde son état entre les tests.
  ipCounter += 1;
  mocks.ip = `203.0.113.${ipCounter}`;
  mocks.submit.mockReset();
  mocks.submit.mockResolvedValue(1);
});

describe("submitContactAction", () => {
  it("enregistre une demande valide (données nettoyées) et confirme le succès", async () => {
    const result = await submitContactAction(null, validForm());

    expect(result).toEqual({ ok: true });
    expect(mocks.submit).toHaveBeenCalledTimes(1);
    expect(mocks.submit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Marie Dupont", email: "marie@exemple.fr" }),
      [],
    );
  });

  it("transmet les pièces jointes valides (vraie image)", async () => {
    // En-tête JPEG réel : la validation lit les octets, pas le type annoncé.
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const form = validForm();
    form.append("attachments", new File([jpeg], "panne.jpg", { type: "image/jpeg" }));

    expect(await submitContactAction(null, form)).toEqual({ ok: true });
    expect(mocks.submit.mock.calls[0]?.[1]).toHaveLength(1);
  });

  it("refuse un fichier déguisé en image (type annoncé falsifié)", async () => {
    const form = validForm();
    form.append("attachments", new File(["MZ-executable"], "virus.exe", { type: "image/png" }));

    const result = await submitContactAction(null, form);

    expect(result?.ok).toBe(false);
    if (result && !result.ok) expect(result.error).toContain("Format non accepté");
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("renvoie un faux succès au robot qui remplit le piège, sans rien enregistrer", async () => {
    const result = await submitContactAction(null, validForm({ company: "Robot SARL" }));

    expect(result).toEqual({ ok: true });
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("refuse une saisie invalide en indiquant les champs en erreur", async () => {
    const result = await submitContactAction(null, validForm({ email: "pas-un-email", name: " " }));

    expect(result?.ok).toBe(false);
    if (result && !result.ok) {
      expect(result.fieldErrors?.email).toBeDefined();
      expect(result.fieldErrors?.name).toBeDefined();
    }
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("refuse une pièce jointe d'un format non autorisé", async () => {
    const form = validForm();
    form.append("attachments", new File(["<script>"], "page.html", { type: "text/html" }));

    const result = await submitContactAction(null, form);

    expect(result?.ok).toBe(false);
    if (result && !result.ok) expect(result.error).toContain("Format non accepté");
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("bloque la 6e demande d'une même adresse IP en 15 minutes", async () => {
    for (let i = 0; i < 5; i += 1) {
      expect(await submitContactAction(null, validForm())).toEqual({ ok: true });
    }

    const result = await submitContactAction(null, validForm());

    expect(result?.ok).toBe(false);
    if (result && !result.ok) expect(result.error).toContain("Trop de demandes");
    expect(mocks.submit).toHaveBeenCalledTimes(5);
  });

  it("ne partage pas la limite entre deux adresses IP différentes", async () => {
    for (let i = 0; i < 5; i += 1) await submitContactAction(null, validForm());
    mocks.ip = "198.51.100.200";

    expect(await submitContactAction(null, validForm())).toEqual({ ok: true });
  });

  it("répond par un message clair avec le téléphone si l'enregistrement échoue", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.submit.mockRejectedValue(new Error("database is locked (marie@exemple.fr)"));

    const result = await submitContactAction(null, validForm());

    expect(result?.ok).toBe(false);
    if (result && !result.ok) expect(result.error).toContain(siteConfig.phone.display);
    expect(String(consoleError.mock.calls[0]?.[0])).not.toContain("marie@exemple.fr");
  });
});
