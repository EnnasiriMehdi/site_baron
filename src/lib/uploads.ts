import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { detectImageType, EXTENSION_BY_IMAGE_TYPE, readImageType } from "./image-type";
import { MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES } from "./upload-limits";

/*
 * Stockage des pièces jointes du formulaire de contact. Toujours hors `public/` (data/uploads/,
 * déjà protégé en lecture par .claude/settings.json et hors Git) : un fichier envoyé par un visiteur
 * ne doit jamais devenir accessible par une simple URL devinée.
 */
const UPLOADS_DIR = path.resolve(process.cwd(), "data", "uploads");

export type AttachmentToStore = {
  originalName: string;
  storedPath: string;
  mimeType: string;
  sizeBytes: number;
};

export type AttachmentValidation = { ok: true; files: File[] } | { ok: false; error: string };

/*
 * Images uniquement (JPG, PNG, WEBP). Le type est déduit des premiers octets du fichier, jamais de
 * `file.type` (écrit par le navigateur du visiteur, falsifiable) : un exécutable ou une page HTML
 * déclarés « image/png » sont refusés. Pas de SVG (peut contenir du script), pas de PDF.
 */
export async function validateAttachments(files: File[]): Promise<AttachmentValidation> {
  if (files.length > MAX_FILES) {
    return { ok: false, error: `${MAX_FILES} pièces jointes maximum (${files.length} envoyées).` };
  }

  let total = 0;
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, error: `"${file.name}" dépasse ${MAX_FILE_BYTES / 1024 / 1024} Mo.` };
    }
    if (!(await readImageType(file))) {
      return { ok: false, error: `Format non accepté pour "${file.name}". Formats acceptés : JPG, PNG, WEBP.` };
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
 * toute tentative de traversée de chemin) et renvoie les métadonnées à insérer en base. Le type et
 * l'extension viennent de la détection par les octets, refaite ici sur le contenu complet : ce module
 * ne fait jamais confiance à `file.type`, même si l'appelant a déjà validé.
 */
export async function storeAttachments(files: File[]): Promise<AttachmentToStore[]> {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const stored: AttachmentToStore[] = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = detectImageType(buffer);
    if (!mimeType) throw new Error("Type de fichier non reconnu.");

    const filename = `${randomUUID()}.${EXTENSION_BY_IMAGE_TYPE[mimeType]}`;
    await writeFile(path.join(UPLOADS_DIR, filename), buffer);

    stored.push({
      originalName: file.name,
      storedPath: filename,
      mimeType,
      sizeBytes: file.size,
    });
  }
  return stored;
}

export function resolveUploadPath(storedPath: string): string {
  // path.basename empêche un storedPath corrompu ("../../...") de sortir du dossier d'uploads.
  return path.join(UPLOADS_DIR, path.basename(storedPath));
}
