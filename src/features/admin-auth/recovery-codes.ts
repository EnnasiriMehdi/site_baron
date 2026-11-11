import "server-only";

import { randomInt } from "node:crypto";

const RECOVERY_CODE_COUNT = 8;
const GROUP_LENGTH = 5;
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans caractères ambigus (0/O, 1/I/L)

function randomGroup(): string {
  let group = "";
  for (let i = 0; i < GROUP_LENGTH; i += 1) {
    group += ALPHABET[randomInt(ALPHABET.length)];
  }
  return group;
}

// Format "XXXXX-XXXXX", facile à relire et à retaper à la main.
export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  return Array.from({ length: count }, () => `${randomGroup()}-${randomGroup()}`);
}

export function normalizeRecoveryCode(input: string): string {
  return input.trim().toUpperCase();
}

export function looksLikeRecoveryCode(input: string): boolean {
  return /^[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(normalizeRecoveryCode(input));
}
