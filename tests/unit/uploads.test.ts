import { beforeEach, describe, expect, it, vi } from "vitest";

// Aucun fichier n'est réellement écrit : on observe ce que le module demanderait d'écrire.
const fsMocks = vi.hoisted(() => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn(),
}));
vi.mock("node:fs/promises", () => fsMocks);

import { storePublicImage, validatePublicImage } from "@/lib/public-image-upload";
import { MAX_FILES, MAX_FILE_BYTES, MAX_STORAGE_BYTES, MAX_TOTAL_BYTES } from "@/lib/upload-limits";
import { selectFilesWithinQuota, storeAttachments, validateAttachments } from "@/lib/uploads";

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
  fsMocks.unlink.mockReset().mockResolvedValue(undefined);
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

  it("n'écrit pas un contenu qui n'est pas une image", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await storeAttachments([file(text("<html>"), "x.png", "image/png")])).toEqual([]);
    expect(fsMocks.writeFile).not.toHaveBeenCalled();
  });

  it("garde les fichiers réussis quand une écriture échoue, et retire le fichier à moitié écrit", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fsMocks.writeFile
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(Object.assign(new Error("disque plein"), { code: "ENOSPC" }))
      .mockResolvedValueOnce(undefined);

    const result = await storeAttachments([
      file(PNG, "1.png", "image/png"),
      file(PNG, "2.png", "image/png"),
      file(JPEG, "3.jpg", "image/jpeg"),
    ]);

    expect(result.map((a) => a.originalName)).toEqual(["1.png", "3.jpg"]);
    // Seul le fichier en échec est retiré : exactement le chemin qui venait d'être écrit.
    expect(fsMocks.unlink).toHaveBeenCalledTimes(1);
    expect(fsMocks.unlink).toHaveBeenCalledWith(fsMocks.writeFile.mock.calls[1]?.[0]);
  });

  it("continue même si le retrait du fichier à moitié écrit échoue aussi", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fsMocks.writeFile.mockRejectedValueOnce(new Error("disque plein"));
    fsMocks.unlink.mockRejectedValue(new Error("absent"));

    const result = await storeAttachments([file(PNG, "1.png", "image/png"), file(PNG, "2.png", "image/png")]);

    expect(result.map((a) => a.originalName)).toEqual(["2.png"]);
  });

  it("ne lève pas d'erreur si le dossier ne peut pas être créé : aucun fichier enregistré", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fsMocks.mkdir.mockRejectedValue(new Error("lecture seule"));

    expect(await storeAttachments([file(PNG, "1.png", "image/png")])).toEqual([]);
    expect(fsMocks.writeFile).not.toHaveBeenCalled();
  });

  it("ne journalise jamais le nom du fichier du visiteur", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    fsMocks.writeFile.mockRejectedValue(new Error("échec sur marie-dupont.png"));

    await storeAttachments([file(PNG, "marie-dupont.png", "image/png")]);

    expect(consoleError).toHaveBeenCalled();
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("marie-dupont");
  });
});

describe("selectFilesWithinQuota (quota global)", () => {
  const sized = (name: string, size: number) => ({ name, size }) as File;
  const names = (files: File[]) => files.map((f) => f.name);

  it("garde tout tant que le total stocké + l'envoi tient dans le plafond", async () => {
    fsMocks.readdir.mockResolvedValue(["a.jpg", "b.jpg"]);
    fsMocks.stat.mockResolvedValue({ size: 1000 });

    expect(names(await selectFilesWithinQuota([sized("1", 500), sized("2", 500)]))).toEqual(["1", "2"]);
  });

  it("garde, dans l'ordre d'envoi, les seuls fichiers qui tiennent", async () => {
    fsMocks.readdir.mockResolvedValue(["a.jpg"]);
    fsMocks.stat.mockResolvedValue({ size: MAX_STORAGE_BYTES - 1000 });

    const kept = await selectFilesWithinQuota([sized("1", 600), sized("trop gros", 600), sized("3", 400)]);

    expect(names(kept)).toEqual(["1", "3"]);
  });

  it("ne garde rien quand le quota est atteint", async () => {
    fsMocks.readdir.mockResolvedValue(["a.jpg"]);
    fsMocks.stat.mockResolvedValue({ size: MAX_STORAGE_BYTES });

    expect(await selectFilesWithinQuota([sized("1", 1)])).toEqual([]);
  });

  it("considère le dossier vide s'il n'existe pas encore", async () => {
    fsMocks.readdir.mockRejectedValue(Object.assign(new Error("absent"), { code: "ENOENT" }));

    expect(await selectFilesWithinQuota([sized("1", 1024)])).toHaveLength(1);
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
