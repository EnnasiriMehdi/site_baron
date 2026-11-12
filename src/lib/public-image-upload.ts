import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { detectImageType, EXTENSION_BY_IMAGE_TYPE, readImageType } from "./image-type";
import { MAX_IMAGE_BYTES } from "./upload-limits";

/*
 * Stockage des images publiques gérées par l'admin (réalisations, couverture d'article) —
 * à la différence de lib/uploads.ts (pièces jointes privées des leads, hors public/), ces photos
 * sont destinées à être vues par tout visiteur et doivent passer par next/image : elles vivent
 * donc sous public/uploads/, en chemin statique, sans configuration images.* supplémentaire.
 * Gérées par l'admin uniquement (jamais un visiteur), mais la même discipline s'applique quand
 * même : type déduit des octets (jamais de `file.type`), nom de fichier généré.
 */
const PUBLIC_UPLOADS_ROOT = path.resolve(process.cwd(), "public", "uploads");

export type ImageValidation = { ok: true; file: File } | { ok: false; error: string };

export async function validatePublicImage(file: File): Promise<ImageValidation> {
  if (!(await readImageType(file))) {
    return { ok: false, error: "Format non accepté. Formats acceptés : JPG, PNG, WEBP." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `L'image dépasse ${MAX_IMAGE_BYTES / 1024 / 1024} Mo.` };
  }
  return { ok: true, file };
}

// `subdir` sépare les photos par usage (ex. "realisations", "articles") dans public/uploads/.
export async function storePublicImage(file: File, subdir: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = detectImageType(buffer);
  if (!mimeType) throw new Error("Type de fichier non reconnu.");

  const dir = path.join(PUBLIC_UPLOADS_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${randomUUID()}.${EXTENSION_BY_IMAGE_TYPE[mimeType]}`;
  await writeFile(path.join(dir, filename), buffer);

  // Chemin public utilisable directement comme src de next/image.
  return `/uploads/${subdir}/${filename}`;
}
