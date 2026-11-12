/*
 * Allègement des photos DANS le navigateur, avant l'envoi : une photo de téléphone (3 à 12 Mo) devient
 * un JPEG d'environ 0,5 à 1,2 Mo. Envoi plus rapide en 4G, limites de taille moins souvent atteintes, et
 * la géolocalisation (EXIF) est supprimée au passage.
 * Confort uniquement, jamais une garantie : le serveur revérifie tout (lib/uploads.ts). En cas de doute
 * ou d'échec, on renvoie le fichier d'origine pour ne jamais bloquer le visiteur.
 * Sortie toujours en JPEG : tous les navigateurs savent l'encoder (WebP : non, avec repli à gérer).
 */
export const COMPRESSION_MAX_SIDE = 2560; // px, assez pour lire une plaque signalétique
export const COMPRESSION_QUALITY = 0.85;

// Réduit sans jamais agrandir, en conservant les proportions.
export function computeTargetSize(
  width: number,
  height: number,
  maxSide: number = COMPRESSION_MAX_SIDE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide) return { width, height };
  const ratio = maxSide / longest;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

function toJpegName(name: string): string {
  return `${name.replace(/\.[^.]+$/, "") || "photo"}.jpg`;
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", COMPRESSION_QUALITY));
}

export async function compressImage(file: File): Promise<File> {
  try {
    // "from-image" applique l'orientation EXIF : une photo prise en portrait ne ressort pas couchée.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const { width, height } = computeTargetSize(bitmap.width, bitmap.height);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    // Fond blanc : une capture PNG transparente ne doit pas devenir noire en JPEG.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await canvasToJpeg(canvas);
    // Un résultat plus lourd (petit JPEG déjà optimisé) n'a aucun intérêt : on garde l'original.
    if (!blob || blob.type !== "image/jpeg" || blob.size >= file.size) return file;

    return new File([blob], toJpegName(file.name), { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file;
  }
}
