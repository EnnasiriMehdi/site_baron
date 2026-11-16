import { beforeEach, describe, expect, it, vi } from "vitest";

// Aucun fichier n'est réellement écrit : on observe ce que le module demanderait d'écrire.
const fsMocks = vi.hoisted(() => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));
vi.mock("node:fs/promises", () => fsMocks);

import { storePublicImage, validatePublicImage } from "@/lib/public-image-upload";
import { MAX_FILES, MAX_FILE_BYTES, MAX_STORAGE_BYTES, MAX_TOTAL_BYTES } from "@/lib/upload-limits";
import { storageHasRoomFor, storeAttachments, validateAttachments } from "@/lib/uploads";

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46];
const text = (value: string) => new TextEncoder().encode(value);

function file(bytes: ArrayLike<number>, name: string, type: string): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

beforeEach(() => {
  fsMocks.writeFile.mockReset().mockResolvedValue(undefined);
  fsMocks.mkdir.mockReset().mockResolvedValue(undefined);
  fsMocks.readdir.mockReset().mockResolvedValue([]);
  fsMocks.stat.mockReset().mockResolvedValue({ size: 0 });
});

describe("validateAttachments", () => {
  it("accepte de vraies images, quel que soit leur type annoncé", async () => {
    const result = await validateAttachments([file(PNG, "a.png", "image/png"), file(JPEG, "b.jpg", "")]);
    expect(result.ok).toBe(true);
  });

  it("refuse une page HTML déguisée en PNG", async () => {
    const result = await validateAttachments([file(text("<script>alert(1)</script>"), "x.png", "image/png")]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Format non accepté");
  });

  it("refuse un exécutable renommé en image", async () => {
    const exe = file([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00], "virus.exe", "image/jpeg");
    expect((await validateAttachments([exe])).ok).toBe(false);
  });

  it("refuse un PDF, même authentique", async () => {
    const result = await validateAttachments([file(text("%PDF-1.7\n"), "devis.pdf", "application/pdf")]);
    expect(result.ok).toBe(false);
  });

  it("refuse un fichier vide", async () => {
    expect((await validateAttachments([file([], "vide.png", "image/png")])).ok).toBe(false);
  });

  it("refuse plus de pièces jointes que le maximum", async () => {
    const files = Array.from({ length: MAX_FILES + 1 }, (_, i) => file(PNG, `${i}.png`, "image/png"));
    const result = await validateAttachments(files);
    expect(result.ok).toBe(false);
  });

  it("refuse un envoi dont le total dépasse la limite, même si chaque fichier passe", async () => {
    // 3 fichiers de la taille maximale : chacun passe seul, mais ensemble ils dépassent le total.
    const perFile = MAX_FILE_BYTES - PNG.length;
    expect(perFile * 3).toBeGreaterThan(MAX_TOTAL_BYTES);
    const files = [1, 2, 3].map((i) => file([...PNG, ...new Array(perFile).fill(0)], `${i}.png`, "image/png"));

    const result = await validateAttachments(files);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("total");
  });

  it("refuse un fichier trop lourd", async () => {
    const big = file([...PNG, ...new Array(MAX_FILE_BYTES).fill(0)], "gros.png", "image/png");
    const result = await validateAttachments([big]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("dépasse");
  });
});

describe("storeAttachments", () => {
  it("enregistre le type et l'extension DÉTECTÉS, pas ceux annoncés", async () => {
    const disguised = file(PNG, "virus.exe", "application/x-msdownload");

    const [stored] = await storeAttachments([disguised]);

    expect(stored?.mimeType).toBe("image/png");
    expect(stored?.storedPath).toMatch(/^\d+-[0-9a-f-]{36}\.png$/);
    // Le nom d'origine n'est conservé que pour l'affichage, jamais comme chemin.
    expect(stored?.originalName).toBe("virus.exe");
    expect(fsMocks.writeFile).toHaveBeenCalledTimes(1);
  });

  it("refuse d'écrire un contenu qui n'est pas une image", async () => {
    await expect(storeAttachments([file(text("<html>"), "x.png", "image/png")])).rejects.toThrow();
    expect(fsMocks.writeFile).not.toHaveBeenCalled();
  });
});

describe("storageHasRoomFor (quota global)", () => {
  it("accepte tant que le total stocké + l'envoi tient dans le plafond", async () => {
    fsMocks.readdir.mockResolvedValue(["a.jpg", "b.jpg"]);
    fsMocks.stat.mockResolvedValue({ size: 1000 });

    expect(await storageHasRoomFor(1000)).toBe(true);
  });

  it("refuse dès que le plafond serait dépassé", async () => {
    fsMocks.readdir.mockResolvedValue(["a.jpg", "b.jpg"]);
    fsMocks.stat.mockResolvedValue({ size: MAX_STORAGE_BYTES / 2 });

    expect(await storageHasRoomFor(1)).toBe(false);
  });

  it("considère le dossier vide s'il n'existe pas encore", async () => {
    fsMocks.readdir.mockRejectedValue(Object.assign(new Error("absent"), { code: "ENOENT" }));

    expect(await storageHasRoomFor(1024)).toBe(true);
  });
});

describe("validatePublicImage / storePublicImage", () => {
  it("valide une vraie image et refuse un faux fichier", async () => {
    expect((await validatePublicImage(file(JPEG, "a.jpg", "image/jpeg"))).ok).toBe(true);
    expect((await validatePublicImage(file(text("MZ"), "a.jpg", "image/jpeg"))).ok).toBe(false);
  });

  it("garde le nom réel, avec l'extension déduite du contenu", async () => {
    const url = await storePublicImage(file(JPEG, "Chaudière murale.png", "image/png"), "realisations");

    expect(url).toBe("/uploads/realisations/Chaudiere_murale.jpg");
  });

  it("n'écrase jamais une photo de même nom", async () => {
    fsMocks.writeFile
      .mockRejectedValueOnce(Object.assign(new Error("exists"), { code: "EEXIST" }))
      .mockResolvedValueOnce(undefined);

    const url = await storePublicImage(file(JPEG, "photo.jpg", "image/jpeg"), "realisations");

    expect(url).toBe("/uploads/realisations/photo-2.jpg");
  });

  it("refuse d'écrire un contenu qui n'est pas une image", async () => {
    await expect(storePublicImage(file(text("<html>"), "x.png", "image/png"), "articles")).rejects.toThrow();
    expect(fsMocks.writeFile).not.toHaveBeenCalled();
  });
});
