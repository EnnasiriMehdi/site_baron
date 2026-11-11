import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { ALLOWED_MIME_TYPES, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES } from "./upload-limits";

/*
 * Stockage des pièces jointes du formulaire de contact. Toujours hors `public/` (data/uploads/,
 * déjà protégé en lecture par .claude/settings.json et hors Git) : un fichier envoyé par un visiteur
 * ne doit jamais devenir accessible par une simple URL devinée.
 */
const UPLOADS_DIR = path.resolve(process.cwd(), "data", "uploads");

// Allowlist stricte : seuls des formats qu'on sait afficher sans risque une fois téléchargés.
// Pas de SVG (peut contenir du script), pas d'exécutable, pas de HTML.
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export type AttachmentToStore = {
  originalName: string;
  storedPath: string;
  mimeType: string;
  sizeBytes: number;
};

export type AttachmentValidation = { ok: true; files: File[] } | { ok: false; error: string };

export function validateAttachments(files: File[]): AttachmentValidation {
  if (files.length > MAX_FILES) {
    return { ok: false, error: `5 pièces jointes maximum (${files.length} envoyées).` };
  }

  let total = 0;
  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return { ok: false, error: `Format non accepté pour "${file.name}". Formats acceptés : JPG, PNG, WEBP, PDF.` };
    }
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, error: `"${file.name}" dépasse ${MAX_FILE_BYTES / 1024 / 1024} Mo.` };
    }
    total += file.size;
  }
  if (total > MAX_TOTAL_BYTES) {
    return { ok: false, error: `Le total des pièces jointes dépasse ${MAX_TOTAL_BYTES / 1024 / 1024} Mo.` };
  }

  return { ok: true, files };
}

/*
 * Écrit les fichiers sur disque avec un nom généré (jamais le nom fourni par le visiteur, pour éviter
 * toute tentative de traversée de chemin) et renvoie les métadonnées à insérer en base.
 */
export async function storeAttachments(files: File[]): Promise<AttachmentToStore[]> {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const stored: AttachmentToStore[] = [];
  for (const file of files) {
    const extension = EXTENSION_BY_MIME[file.type];
    const filename = `${randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOADS_DIR, filename), buffer);

    stored.push({
      originalName: file.name,
      storedPath: filename,
      mimeType: file.type,
      sizeBytes: file.size,
    });
  }
  return stored;
}

export function resolveUploadPath(storedPath: string): string {
  // path.basename empêche un storedPath corrompu ("../../...") de sortir du dossier d'uploads.
  return path.join(UPLOADS_DIR, path.basename(storedPath));
}
