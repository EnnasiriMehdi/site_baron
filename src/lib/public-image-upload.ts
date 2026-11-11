import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from "./upload-limits";

/*
 * Stockage des images publiques gérées par l'admin (réalisations, couverture d'article) —
 * à la différence de lib/uploads.ts (pièces jointes privées des leads, hors public/), ces photos
 * sont destinées à être vues par tout visiteur et doivent passer par next/image : elles vivent
 * donc sous public/uploads/, en chemin statique, sans configuration images.* supplémentaire.
 * Gérées par l'admin uniquement (jamais un visiteur), mais la même discipline s'applique quand
 * même : allowlist stricte, nom de fichier généré, jamais le nom fourni par l'admin.
 */
const PUBLIC_UPLOADS_ROOT = path.resolve(process.cwd(), "public", "uploads");

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ImageValidation = { ok: true; file: File } | { ok: false; error: string };

export function validatePublicImage(file: File): ImageValidation {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return { ok: false, error: "Format non accepté. Formats acceptés : JPG, PNG, WEBP." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `L'image dépasse ${MAX_IMAGE_BYTES / 1024 / 1024} Mo.` };
  }
  return { ok: true, file };
}

// `subdir` sépare les photos par usage (ex. "realisations", "articles") dans public/uploads/.
export async function storePublicImage(file: File, subdir: string): Promise<string> {
  const dir = path.join(PUBLIC_UPLOADS_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const extension = EXTENSION_BY_MIME[file.type];
  const filename = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  // Chemin public utilisable directement comme src de next/image.
  return `/uploads/${subdir}/${filename}`;
}
