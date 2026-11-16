/*
 * Détection du VRAI type d'une image d'après ses premiers octets (« signature »), jamais d'après
 * `file.type` ni l'extension : ces deux valeurs sont écrites par le navigateur du visiteur et sont
 * falsifiables. Pas de "server-only" : fonctions pures, sans accès à rien.
 * Prouve qu'un fichier a l'allure du format annoncé, pas qu'il est inoffensif.
 */
export type DetectedImageType = "image/jpeg" | "image/png" | "image/webp";

// Plus longue signature : « RIFF » + 4 octets de taille + « WEBP » = 12 octets.
export const SIGNATURE_BYTES = 12;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
// WebP = conteneur RIFF : « RIFF » (octets 0-3), 4 octets de taille, puis « WEBP » (octets 8-11).
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];
const WEBP_OFFSET = 8;

function startsWith(
  bytes: Uint8Array,
  signature: number[],
  offset = 0,
): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}

export function detectImageType(bytes: Uint8Array): DetectedImageType | null {
  if (startsWith(bytes, JPEG_SIGNATURE)) return "image/jpeg";
  if (startsWith(bytes, PNG_SIGNATURE)) return "image/png";
  if (
    startsWith(bytes, RIFF_SIGNATURE) &&
    startsWith(bytes, WEBP_SIGNATURE, WEBP_OFFSET)
  ) {
    return "image/webp";
  }
  return null;
}

// Ne lit que le début du fichier : coût négligeable même pour une photo de plusieurs Mo.
export async function readImageType(
  file: Blob,
): Promise<DetectedImageType | null> {
  const head = new Uint8Array(
    await file.slice(0, SIGNATURE_BYTES).arrayBuffer(),
  );
  return detectImageType(head);
}

export const EXTENSION_BY_IMAGE_TYPE: Record<DetectedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/*
 * Nom proposé au téléchargement : le nom d'origine (choisi par le visiteur) est nettoyé, et l'extension
 * est TOUJOURS celle du type vérifié. Sans cela, un « virus.exe » déguisé en image serait téléchargé
 * sous ce nom. Les types inconnus (anciennes données) reçoivent « .bin ».
 */
export function safeDownloadName(
  originalName: string,
  mimeType: string,
): string {
  const base = originalName
    .replace(/\.[^.]*$/, "") // retire la dernière extension annoncée
    .normalize("NFD")
    .replace(/\p{M}/gu, "") // retire les accents (marques combinantes)
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^[._-]+/, "")
    .slice(0, 80);
  const extension =
    EXTENSION_BY_IMAGE_TYPE[mimeType as DetectedImageType] ?? "bin";
  return `${base || "piece-jointe"}.${extension}`;
}
