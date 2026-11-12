/*
 * Limites et formats des pièces jointes : source unique partagée entre la validation client
 * (ContactForm, retour immédiat) et la validation serveur (lib/uploads.ts, seule autorité réelle).
 * Pas de "server-only" ici : ce fichier ne contient que des constantes, importable des deux côtés.
 */
export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 Mo
export const MAX_TOTAL_BYTES = 20 * 1024 * 1024; // 20 Mo

// Images uniquement : le PDF (JavaScript, actions embarquées, lecteurs souvent visés) est refusé.
// Sert à l'attribut `accept` du formulaire ; le serveur, lui, ne se fie jamais à `file.type` mais aux
// premiers octets du fichier (lib/image-type.ts).
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 Mo (photos publiques gérées par l'admin)
