import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { stripImageMetadata } from "./image-metadata";
import { detectImageType, readImageType, safeDownloadName, type DetectedImageType } from "./image-type";
import { MAX_IMAGE_BYTES } from "./upload-limits";

/*
 * Stockage des images publiques gérées par l'admin (réalisations, couverture d'article) —
 * à la différence de lib/uploads.ts (pièces jointes privées des leads, hors public/), ces photos
 * sont destinées à être vues par tout visiteur et doivent passer par next/image : elles vivent
 * donc sous public/uploads/, en chemin statique, sans configuration images.* supplémentaire.
 * Gérées par l'admin uniquement (jamais un visiteur), mais la même discipline s'applique quand
 * même : type déduit des octets (jamais de `file.type`), nom nettoyé, extension imposée, et
 * métadonnées retirées (position GPS) puisque le fichier est public.
 */
const PUBLIC_UPLOADS_ROOT = path.resolve(process.cwd(), "public", "uploads");

export type ImageValidation = { ok: true; file: File } | { ok: false; error: string };

async function readWithoutMetadata(file: File, type: DetectedImageType): Promise<Uint8Array> {
  return stripImageMetadata(new Uint8Array(await file.arrayBuffer()), type);
}

export async function validatePublicImage(file: File): Promise<ImageValidation> {
  const type = await readImageType(file);
  if (!type) {
    return { ok: false, error: "Format non accepté. Formats acceptés : JPG, PNG, WEBP." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `L'image dépasse ${MAX_IMAGE_BYTES / 1024 / 1024} Mo.` };
  }
  try {
    await readWithoutMetadata(file, type);
  } catch {
    return { ok: false, error: "Image illisible. Enregistrez-la à nouveau ou choisissez une autre photo." };
  }
  return { ok: true, file };
}

// `subdir` sépare les photos par usage (ex. "realisations", "articles") dans public/uploads/.
export async function storePublicImage(file: File, subdir: string): Promise<string> {
  const mimeType = detectImageType(new Uint8Array(await file.arrayBuffer()));
  if (!mimeType) throw new Error("Type de fichier non reconnu.");
  const data = await readWithoutMetadata(file, mimeType);

  const dir = path.join(PUBLIC_UPLOADS_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  // Nom réel conservé (utile au SEO), mais nettoyé et avec l'extension du type vérifié :
  // jamais de caractère dangereux ni d'extension choisie dans le nom d'origine.
  const filename = await writeWithoutOverwriting(dir, safeDownloadName(file.name, mimeType), data);

  // Chemin public utilisable directement comme src de next/image.
  return `/uploads/${subdir}/${filename}`;
}

// Flag "wx" : échoue si le fichier existe déjà. Deux photos au même nom ne s'écrasent jamais :
// la seconde devient « nom-2.jpg », « nom-3.jpg »...
async function writeWithoutOverwriting(dir: string, filename: string, data: Uint8Array): Promise<string> {
  const { name, ext } = path.parse(filename);
  for (let attempt = 1; attempt <= 100; attempt++) {
    const candidate = attempt === 1 ? filename : `${name}-${attempt}${ext}`;
    try {
      await writeFile(path.join(dir, candidate), data, { flag: "wx" });
      return candidate;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  }
  throw new Error("Impossible de trouver un nom de fichier libre.");
}
