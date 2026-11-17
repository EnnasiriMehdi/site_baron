/*
 * Limites et formats des pièces jointes : source unique partagée entre la validation client
 * (ContactForm, retour immédiat) et la validation serveur (lib/uploads.ts, seule autorité réelle).
 * Pas de "server-only" ici : ce fichier ne contient que des constantes, importable des deux côtés.
 */
// Dimensionné pour des photos déjà allégées dans le navigateur (≈ 0,5 à 1,2 Mo chacune) : une marge
// confortable pour 5 photos, mais un envoi malveillant ne dépasse jamais 8 Mo.
export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3 Mo
export const MAX_TOTAL_BYTES = 8 * 1024 * 1024; // 8 Mo

// Plafond de tout ce qui est stocké dans data/uploads/ (toutes demandes confondues) : filet de sécurité
// contre le remplissage du disque, quelles que soient les IP utilisées. À ajuster selon le disque du VPS.
export const MAX_STORAGE_BYTES = 2 * 1024 * 1024 * 1024; // 2 Go

// Part du quota à partir de laquelle l'admin est prévenu (carte du tableau de bord + un e-mail au franchissement).
export const STORAGE_WARNING_RATIO = 0.8;

// Envois avec pièces jointes acceptés pour TOUT le site sur une fenêtre, quelle que soit l'IP.
export const GLOBAL_ATTACHMENT_SUBMISSIONS = 30;
export const GLOBAL_ATTACHMENT_WINDOW_MS = 60 * 60 * 1000; // 1 h

// Images uniquement : le PDF (JavaScript, actions embarquées, lecteurs souvent visés) est refusé.
// Sert à l'attribut `accept` du formulaire ; le serveur, lui, ne se fie jamais à `file.type` mais aux
// premiers octets du fichier (lib/image-type.ts).
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 Mo (photos publiques gérées par l'admin)

// Résultat de la mesure du stockage (lib/uploads.ts) : type ici pour être utilisable sans importer de module serveur.
export type StorageUsage = { usedBytes: number; maxBytes: number; percent: number };
