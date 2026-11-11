import "server-only";

import { argon2id, hash, verify } from "argon2";

/*
 * Paramètres Argon2id au minimum recommandé par l'OWASP Password Storage Cheat Sheet.
 * Ne pas les abaisser pour accélérer les tests : utiliser un mock du service d'authentification à la place.
 */
const HASH_OPTIONS = {
  type: argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, HASH_OPTIONS);
}

export async function verifyPassword(storedHash: string, plain: string): Promise<boolean> {
  try {
    return await verify(storedHash, plain);
  } catch {
    // Un hash mal formé ne doit jamais faire planter la connexion : on le traite comme un échec.
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/*
 * Hash factice utilisé quand l'e-mail n'existe pas : la réponse prend le même temps,
 * ce qui empêche de deviner les comptes existants par mesure de durée.
 */
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword("timing-equalization-placeholder");
  return dummyHash;
}
