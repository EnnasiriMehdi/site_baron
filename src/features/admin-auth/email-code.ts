import "server-only";

import { randomInt } from "node:crypto";

const GROUP_LENGTH = 4;
// Sans caractères ambigus (0/O, 1/I/L) : le code est relu dans un e-mail puis retapé à la main.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomGroup(): string {
  let group = "";
  for (let i = 0; i < GROUP_LENGTH; i += 1) {
    group += ALPHABET[randomInt(ALPHABET.length)];
  }
  return group;
}

// Format "XXXX-XXXX" (~40 bits). Court-vécu (15 min) et limité à 5 essais, donc suffisant.
export function generateEmailCode(): string {
  return `${randomGroup()}-${randomGroup()}`;
}

// Tolère les espaces et la casse ; le tiret manquant est remis (copier-coller imparfait).
export function normalizeEmailCode(input: string): string {
  const compact = input.replace(/[\s-]/g, "").toUpperCase();
  return compact.length === GROUP_LENGTH * 2
    ? `${compact.slice(0, GROUP_LENGTH)}-${compact.slice(GROUP_LENGTH)}`
    : compact;
}
