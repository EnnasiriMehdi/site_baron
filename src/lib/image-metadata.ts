import type { DetectedImageType } from "./image-type";

/*
 * Retrait des métadonnées d'une image destinée à être publiée (position GPS d'un chantier ou d'un client, modèle
 * d'appareil, date…). L'image n'est pas réencodée : seuls les blocs de métadonnées sont écartés, et tout ce qui
 * suit la fin de l'image est coupé (les téléphones y ajoutent des images secondaires ou des vidéos).
 * Un fichier dont la structure ne peut pas être lue lève une erreur : mieux vaut le refuser que le publier tel quel.
 * L'orientation EXIF est retirée aussi : c'est l'allègement dans le navigateur qui l'inscrit dans les pixels.
 */
export function stripImageMetadata(bytes: Uint8Array, type: DetectedImageType): Uint8Array {
  if (type === "image/jpeg") return stripJpeg(bytes);
  if (type === "image/png") return stripPng(bytes);
  return stripWebp(bytes);
}

function unreadable(): never {
  throw new Error("Structure d'image illisible.");
}

function concat(parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function view(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

// ---------- JPEG : suite de segments « FF, marqueur, longueur, contenu » ----------

const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;
const APP0 = 0xe0;
const APP2 = 0xe2;
const APP14 = 0xee;
const APP15 = 0xef;
const COMMENT = 0xfe;

const isRestartMarker = (marker: number) => marker >= 0xd0 && marker <= 0xd7;

// Liste blanche des segments applicatifs : tout autre APPn (EXIF, XMP, IPTC, images multiples…) est écarté.
function keepJpegSegment(marker: number, payload: Uint8Array): boolean {
  if (marker === COMMENT) return false;
  if (marker < APP0 || marker > APP15) return true; // tables et dimensions de l'image
  if (marker === APP2) return ascii(payload, 0, 12) === "ICC_PROFILE\0"; // profil couleur
  return marker === APP0 || marker === APP14;
}

function stripJpeg(bytes: Uint8Array): Uint8Array {
  if (bytes[0] !== 0xff || bytes[1] !== SOI) unreadable();
  const parts = [bytes.subarray(0, 2)];
  let position = 2;
  let hasScan = false;

  while (position + 1 < bytes.length) {
    if (bytes[position] !== 0xff) unreadable();
    const marker = bytes[position + 1]!;
    if (marker === 0xff) {
      position += 1; // octet de remplissage
      continue;
    }
    if (marker === EOI) {
      if (!hasScan) unreadable();
      parts.push(bytes.subarray(position, position + 2));
      return concat(parts); // tout ce qui suit est abandonné
    }
    if (marker === 0x01 || isRestartMarker(marker)) {
      parts.push(bytes.subarray(position, position + 2));
      position += 2;
      continue;
    }

    if (position + 4 > bytes.length) unreadable();
    const length = view(bytes).getUint16(position + 2);
    const end = position + 2 + length;
    if (length < 2 || end > bytes.length) unreadable();
    if (keepJpegSegment(marker, bytes.subarray(position + 4, end))) {
      parts.push(bytes.subarray(position, end));
    }
    position = end;

    if (marker === SOS) {
      // Données compressées jusqu'au prochain vrai marqueur (un JPEG progressif en enchaîne plusieurs).
      hasScan = true;
      let next = position;
      while (next + 1 < bytes.length) {
        const following = bytes[next + 1]!;
        if (bytes[next] === 0xff && following !== 0x00 && following !== 0xff && !isRestartMarker(following)) break;
        next += 1;
      }
      parts.push(bytes.subarray(position, next));
      position = next;
    }
  }
  return unreadable(); // pas de marqueur de fin : fichier tronqué
}

// ---------- PNG : signature puis blocs « longueur, type, contenu, contrôle » ----------

const PNG_METADATA_CHUNKS = new Set(["eXIf", "tEXt", "zTXt", "iTXt", "tIME"]);

function stripPng(bytes: Uint8Array): Uint8Array {
  const parts = [bytes.subarray(0, 8)];
  let position = 8;
  let hasData = false;

  while (position + 12 <= bytes.length) {
    const end = position + 12 + view(bytes).getUint32(position);
    if (end > bytes.length) unreadable();
    const type = ascii(bytes, position + 4, 4);
    if (!PNG_METADATA_CHUNKS.has(type)) parts.push(bytes.subarray(position, end));
    if (type === "IDAT") hasData = true;
    if (type === "IEND") {
      if (!hasData) unreadable();
      return concat(parts);
    }
    position = end;
  }
  return unreadable();
}

// ---------- WebP : conteneur RIFF, blocs « type, taille, contenu » alignés sur 2 octets ----------

const WEBP_METADATA_CHUNKS = new Set(["EXIF", "XMP "]);
const WEBP_IMAGE_CHUNKS = new Set(["VP8 ", "VP8L", "ANMF"]);
// Indicateurs du bloc VP8X annonçant la présence d'EXIF (0x08) et de XMP (0x04).
const VP8X_METADATA_FLAGS = 0x0c;

function stripWebp(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 12) unreadable();
  const end = 8 + view(bytes).getUint32(4, true);
  if (end > bytes.length || end < 12) unreadable();

  const chunks: Uint8Array[] = [];
  let position = 12;
  let hasImage = false;

  while (position < end) {
    if (position + 8 > end) unreadable();
    const size = view(bytes).getUint32(position + 4, true);
    if (position + 8 + size > end) unreadable();
    const type = ascii(bytes, position, 4);
    const paddedSize = size + (size % 2);

    if (!WEBP_METADATA_CHUNKS.has(type)) {
      // Copie complétée à une taille paire (l'octet de remplissage final manque parfois).
      const chunk = new Uint8Array(8 + paddedSize);
      chunk.set(bytes.subarray(position, position + 8 + size));
      if (type === "VP8X") {
        if (size < 10) unreadable();
        chunk[8] = chunk[8]! & ~VP8X_METADATA_FLAGS;
      }
      chunks.push(chunk);
      if (WEBP_IMAGE_CHUNKS.has(type)) hasImage = true;
    }
    position += 8 + paddedSize;
  }
  if (!hasImage) unreadable();

  const header = new Uint8Array(bytes.subarray(0, 12));
  view(header).setUint32(4, 4 + chunks.reduce((total, chunk) => total + chunk.length, 0), true);
  return concat([header, ...chunks]);
}
