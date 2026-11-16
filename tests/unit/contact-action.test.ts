import { beforeEach, describe, expect, it, vi } from "vitest";

// Valeurs lues par les doubles ci-dessous (vi.mock est hissé avant les imports).
const mocks = vi.hoisted(() => ({
  ip: "203.0.113.1",
  submit: vi.fn(),
  verifyToken: vi.fn(),
  hasRoom: vi.fn(),
}));

vi.mock("@/lib/client-ip", () => ({ clientIp: async () => mocks.ip }));
vi.mock("@/features/contact/contact-instance", () => ({ contactService: { submit: mocks.submit } }));
vi.mock("@/features/contact/form-token", () => ({
  createFormToken: async () => "jeton",
  verifyFormToken: mocks.verifyToken,
}));
// Le quota lit le disque : remplacé par un double. La validation des fichiers reste la vraie.
vi.mock("@/lib/uploads", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/uploads")>()),
  storageHasRoomFor: mocks.hasRoom,
}));

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
  mocks.verifyToken.mockReset();
  mocks.verifyToken.mockResolvedValue(true);
  mocks.hasRoom.mockReset();
  mocks.hasRoom.mockResolvedValue(true);
});

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

function formWithPhoto(): FormData {
  const form = validForm();
  form.append("attachments", new File([JPEG_BYTES], "panne.jpg", { type: "image/jpeg" }));
  return form;
}

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

  it("refuse un envoi sans jeton de formulaire valide, sans rien enregistrer", async () => {
    mocks.verifyToken.mockResolvedValue(false);

    const result = await submitContactAction(null, validForm());

    expect(result?.ok).toBe(false);
    if (result && !result.ok) expect(result.error).toContain("expiré");
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("refuse les pièces jointes quand le quota de stockage est atteint, message toujours possible", async () => {
    mocks.hasRoom.mockResolvedValue(false);

    const refused = await submitContactAction(null, formWithPhoto());
    expect(refused?.ok).toBe(false);
    if (refused && !refused.ok) expect(refused.error).toContain("sans pièce jointe");
    expect(mocks.submit).not.toHaveBeenCalled();

    // Le même message, sans fichier, passe : on ne perd jamais une demande à cause du quota.
    expect(await submitContactAction(null, validForm())).toEqual({ ok: true });
    expect(mocks.hasRoom).toHaveBeenCalledTimes(1);
  });

  it("plafonne les envois avec pièces jointes pour tout le site, même depuis des IP différentes", async () => {
    let accepted = 0;
    let refusedCount = 0;
    for (let i = 0; i < 40; i += 1) {
      mocks.ip = `192.0.2.${i + 1}`;
      const result = await submitContactAction(null, formWithPhoto());
      if (result?.ok) accepted += 1;
      else refusedCount += 1;
    }

    expect(accepted).toBeLessThanOrEqual(30);
    expect(refusedCount).toBeGreaterThanOrEqual(10);
    // Sans fichier, le formulaire reste utilisable même quand le plafond global est atteint.
    mocks.ip = "192.0.2.250";
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
