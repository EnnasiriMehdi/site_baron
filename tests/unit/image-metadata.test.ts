import { describe, expect, it } from "vitest";

import { stripImageMetadata } from "@/lib/image-metadata";

// Images minimales construites à la main : seule la structure compte, aucun décodage n'est nécessaire.
const SECRET = "GPS 48.8566,2.3522";
const chars = (value: string) => Array.from(value, (c) => c.charCodeAt(0));
const asText = (bytes: Uint8Array) => String.fromCharCode(...bytes);
const u32be = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const u32le = (n: number) => u32be(n).reverse();

const segment = (marker: number, payload: number[]) => [
  0xff,
  marker,
  (payload.length + 2) >> 8,
  (payload.length + 2) & 255,
  ...payload,
];
const scan = (data: number[]) => [...segment(0xda, [1, 1, 0]), ...data];
const EOI = [0xff, 0xd9];

const chunk = (type: string, data: number[]) => [...u32be(data.length), ...chars(type), ...data, 0, 0, 0, 0];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const riffChunk = (type: string, data: number[]) => [
  ...chars(type),
  ...u32le(data.length),
  ...data,
  ...(data.length % 2 ? [0] : []),
];
const webp = (...chunks: number[][]) => {
  const body = [...chars("WEBP"), ...chunks.flat()];
  return [...chars("RIFF"), ...u32le(body.length), ...body];
};

const strip = (bytes: number[], type: "image/jpeg" | "image/png" | "image/webp") =>
  stripImageMetadata(new Uint8Array(bytes), type);

describe("stripImageMetadata : JPEG", () => {
  const jfif = segment(0xe0, chars("JFIF\0"));
  const colour = segment(0xe2, chars("ICC_PROFILE\0profil"));
  const tables = segment(0xdb, [0, 1, 2]);
  const image = scan([0x12, 0xff, 0x00, 0x34, 0xff, 0xd0, 0x56]); // octet échappé et marqueur de reprise

  it("retire EXIF, XMP, IPTC, images multiples et commentaires, garde l'image et le profil couleur", () => {
    const input = [
      0xff,
      0xd8,
      ...jfif,
      ...segment(0xe1, chars(`Exif\0\0${SECRET}`)),
      ...segment(0xe1, chars(`http://ns.adobe.com/xap/1.0/\0${SECRET}`)),
      ...segment(0xed, chars(SECRET)),
      ...segment(0xe2, chars(`MPF\0${SECRET}`)),
      ...segment(0xfe, chars(SECRET)),
      ...colour,
      ...tables,
      ...image,
      ...EOI,
    ];

    expect([...strip(input, "image/jpeg")]).toEqual([0xff, 0xd8, ...jfif, ...colour, ...tables, ...image, ...EOI]);
  });

  it("coupe tout ce qui suit la fin de l'image (image secondaire, vidéo)", () => {
    const main = [0xff, 0xd8, ...image, ...EOI];
    const appended = [0xff, 0xd8, ...segment(0xe1, chars(SECRET)), ...image, ...EOI, ...chars(SECRET)];

    expect([...strip([...main, ...appended], "image/jpeg")]).toEqual(main);
  });

  it("garde tous les passages d'un JPEG progressif et retire des métadonnées placées entre eux", () => {
    const tableBetween = segment(0xc4, [9, 9]);
    const input = [0xff, 0xd8, ...image, ...tableBetween, ...segment(0xfe, chars(SECRET)), ...image, ...EOI];

    expect([...strip(input, "image/jpeg")]).toEqual([0xff, 0xd8, ...image, ...tableBetween, ...image, ...EOI]);
  });

  it.each([
    ["sans marqueur de fin", [0xff, 0xd8, ...image]],
    ["segment plus long que le fichier", [0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff, 1]],
    ["sans données d'image", [0xff, 0xd8, ...EOI]],
  ])("refuse un fichier mal formé : %s", (_label, bytes) => {
    expect(() => strip(bytes, "image/jpeg")).toThrow();
  });
});

describe("stripImageMetadata : PNG", () => {
  const header = chunk("IHDR", [1, 2, 3]);
  const profile = chunk("iCCP", [4]);
  const data = chunk("IDAT", [5, 6]);
  const end = chunk("IEND", []);

  it("retire les blocs de métadonnées et ce qui suit la fin", () => {
    const metadata = ["eXIf", "tEXt", "zTXt", "iTXt", "tIME"].flatMap((type) => chunk(type, chars(SECRET)));
    const input = [...PNG_SIGNATURE, ...header, ...metadata, ...profile, ...data, ...end, ...chars(SECRET)];

    expect([...strip(input, "image/png")]).toEqual([...PNG_SIGNATURE, ...header, ...profile, ...data, ...end]);
  });

  it("refuse un fichier tronqué", () => {
    expect(() => strip([...PNG_SIGNATURE, ...header, ...data], "image/png")).toThrow();
    expect(() => strip([...PNG_SIGNATURE, ...u32be(9999), ...chars("IDAT"), 0, 0, 0, 0], "image/png")).toThrow();
  });
});

describe("stripImageMetadata : WebP", () => {
  const extended = (flags: number) => riffChunk("VP8X", [flags, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const data = riffChunk("VP8 ", [1, 2, 3]); // taille impaire : octet de remplissage

  it("retire EXIF et XMP, corrige les indicateurs et la taille", () => {
    const input = webp(extended(0x2c), data, riffChunk("EXIF", chars(SECRET)), riffChunk("XMP ", chars(SECRET)));

    const result = strip([...input, ...chars(SECRET)], "image/webp");

    expect([...result]).toEqual(webp(extended(0x20), data)); // 0x20 : profil couleur, conservé
    expect(asText(result)).not.toContain(SECRET);
  });

  it("refuse un fichier tronqué ou sans image", () => {
    expect(() => strip(webp(data).slice(0, -2), "image/webp")).toThrow();
    expect(() => strip(webp(riffChunk("EXIF", chars(SECRET))), "image/webp")).toThrow();
  });
});
