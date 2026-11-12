import { describe, expect, it } from "vitest";

import { detectImageType, readImageType, safeDownloadName } from "@/lib/image-type";

// Premiers octets réels de chaque format, suivis de quelques octets quelconques.
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
const WEBP = [0x52, 0x49, 0x46, 0x46, 0x24, 0x08, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];
const encode = (text: string) => [...new TextEncoder().encode(text)];

describe("detectImageType", () => {
  it("reconnaît un JPEG, un PNG et un WEBP", () => {
    expect(detectImageType(new Uint8Array(JPEG))).toBe("image/jpeg");
    expect(detectImageType(new Uint8Array(PNG))).toBe("image/png");
    expect(detectImageType(new Uint8Array(WEBP))).toBe("image/webp");
  });

  it("refuse une page HTML, même si elle est annoncée comme une image", () => {
    expect(detectImageType(new Uint8Array(encode("<html><script>alert(1)</script>")))).toBeNull();
  });

  it("refuse un exécutable Windows (MZ)", () => {
    expect(detectImageType(new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]))).toBeNull();
  });

  it("refuse un PDF (format non autorisé)", () => {
    expect(detectImageType(new Uint8Array(encode("%PDF-1.7\n")))).toBeNull();
  });

  it("refuse un SVG (peut contenir du script)", () => {
    expect(detectImageType(new Uint8Array(encode('<svg xmlns="http://www.w3.org/2000/svg">')))).toBeNull();
  });

  it("refuse un RIFF qui n'est pas du WEBP (ex. un fichier WAV)", () => {
    const wav = [0x52, 0x49, 0x46, 0x46, 0x24, 0x08, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45];
    expect(detectImageType(new Uint8Array(wav))).toBeNull();
  });

  it("refuse un fichier vide ou trop court pour avoir une signature", () => {
    expect(detectImageType(new Uint8Array([]))).toBeNull();
    expect(detectImageType(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });
});

describe("readImageType", () => {
  it("lit le type dans le contenu et ignore le type annoncé par le navigateur", async () => {
    const disguised = new File([new Uint8Array(encode("MZ-exécutable"))], "photo.png", { type: "image/png" });
    const real = new File([new Uint8Array(PNG)], "x.bin", { type: "application/octet-stream" });

    expect(await readImageType(disguised)).toBeNull();
    expect(await readImageType(real)).toBe("image/png");
  });
});

describe("safeDownloadName", () => {
  it("impose l'extension du type vérifié, jamais celle choisie par le visiteur", () => {
    expect(safeDownloadName("virus.exe", "image/png")).toBe("virus.png");
    expect(safeDownloadName("facture.pdf.exe", "image/jpeg")).toBe("facture.pdf.jpg");
    expect(safeDownloadName("script.bat", "image/webp")).toBe("script.webp");
  });

  it("nettoie les caractères dangereux ou inutiles", () => {
    expect(safeDownloadName('a"b\r\nc.png', "image/png")).toBe("a_b_c.png");
    expect(safeDownloadName("../../etc/passwd.png", "image/png")).toBe("etc_passwd.png");
  });

  it("retire les accents et garde un nom lisible", () => {
    expect(safeDownloadName("Chaudière en panne.jpg", "image/jpeg")).toBe("Chaudiere_en_panne.jpg");
  });

  it("donne un nom par défaut quand il ne reste rien", () => {
    expect(safeDownloadName("....", "image/png")).toBe("piece-jointe.png");
    expect(safeDownloadName("", "image/png")).toBe("piece-jointe.png");
  });

  it("limite la longueur du nom", () => {
    expect(safeDownloadName(`${"a".repeat(300)}.png`, "image/png").length).toBeLessThanOrEqual(84);
  });

  it("utilise .bin pour un type inconnu (anciennes données)", () => {
    expect(safeDownloadName("rapport.pdf", "application/pdf")).toBe("rapport.bin");
  });
});
