import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { detectImageType, EXTENSION_BY_IMAGE_TYPE, readImageType } from "./image-type";
import { MAX_FILES, MAX_FILE_BYTES, MAX_STORAGE_BYTES, MAX_TOTAL_BYTES, type StorageUsage } from "./upload-limits";

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

// Cause technique seulement (code système ou nom de l'erreur) : jamais le message, qui peut contenir un chemin
// ou un nom de fichier du visiteur (CLAUDE.md, section 8.4).
function logStorageFailure(error: unknown): void {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  const cause = code ?? (error instanceof Error ? error.name : "erreur inconnue");
  console.error(`Échec de l'enregistrement d'une pièce jointe (${cause}).`);
}

async function storeOne(file: File): Promise<AttachmentToStore> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = detectImageType(buffer);
  if (!mimeType) throw new Error("Type de fichier non reconnu.");

  const filename = `${Date.now()}-${randomUUID()}.${EXTENSION_BY_IMAGE_TYPE[mimeType]}`;
  const target = path.join(UPLOADS_DIR, filename);
  try {
    await writeFile(target, buffer);
  } catch (error) {
    // Disque plein : un fichier à moitié écrit peut rester et consommer le quota. Retiré, sans masquer la cause.
    await unlink(target).catch(() => undefined);
    throw error;
  }

  return { originalName: file.name, storedPath: filename, mimeType, sizeBytes: file.size };
}

/*
 * Écrit les fichiers sur disque avec un nom généré (jamais le nom fourni par le visiteur, pour éviter
 * toute tentative de traversée de chemin) et renvoie les métadonnées à insérer en base. Le type et
 * l'extension viennent de la détection par les octets, refaite ici sur le contenu complet : ce module
 * ne fait jamais confiance à `file.type`, même si l'appelant a déjà validé.
 *
 * Ne lève jamais d'erreur : chaque fichier est traité séparément et seuls les réussis sont renvoyés. Une demande
 * n'est jamais perdue à cause d'un fichier ; l'appelant compte les manquants.
 */
export async function storeAttachments(files: File[]): Promise<AttachmentToStore[]> {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    logStorageFailure(error);
    return [];
  }

  const stored: AttachmentToStore[] = [];
  for (const file of files) {
    try {
      stored.push(await storeOne(file));
    } catch (error) {
      logStorageFailure(error);
    }
  }
  return stored;
}

async function storedBytes(): Promise<number> {
  let names: string[];
  try {
    names = await readdir(UPLOADS_DIR);
  } catch {
    return 0; // dossier pas encore créé : rien de stocké
  }
  const sizes = await Promise.all(
    names.map(async (name) => {
      try {
        return (await stat(path.join(UPLOADS_DIR, name))).size;
      } catch {
        return 0; // fichier disparu entre-temps
      }
    }),
  );
  return sizes.reduce((sum, size) => sum + size, 0);
}



// Même mesure que le quota (le disque réel, pas un compteur) : sert à la carte du tableau de bord et à l'alerte.
export async function getStorageUsage(): Promise<StorageUsage> {
  const usedBytes = await storedBytes();
  return {
    usedBytes,
    maxBytes: MAX_STORAGE_BYTES,
    percent: Math.min(100, Math.floor((usedBytes / MAX_STORAGE_BYTES) * 100)),
  };
}

// Quota global : mesure ce qui est réellement sur le disque plutôt qu'un compteur en mémoire, qui
// serait remis à zéro à chaque redémarrage. Renvoie les fichiers qui tiennent, dans l'ordre d'envoi : un fichier
// trop gros pour la place restante n'empêche pas de garder un plus petit qui suit.
export async function selectFilesWithinQuota(files: File[]): Promise<File[]> {
  let used = await storedBytes();
  return files.filter((file) => {
    if (used + file.size > MAX_STORAGE_BYTES) return false;
    used += file.size;
    return true;
  });
}

export function resolveUploadPath(storedPath: string): string {
  // path.basename empêche un storedPath corrompu ("../../...") de sortir du dossier d'uploads.
  return path.join(UPLOADS_DIR, path.basename(storedPath));
}
