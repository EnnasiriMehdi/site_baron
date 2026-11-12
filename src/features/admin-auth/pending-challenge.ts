import "server-only";

import type { User } from "@/lib/db/schema";

import { clearPendingMfaChallenge, readPendingMfaChallenge } from "./mfa-session";
import { drizzleAdminUserRepository } from "./user-repository";

/*
 * Utilisateur correspondant au défi « 2FA en attente », ou null si le défi est absent, expiré, ou
 * périmé (compte supprimé, ou sessions révoquées depuis la saisie du mot de passe). Dans ce dernier
 * cas le défi est effacé : l'appelant renvoie simplement vers la connexion.
 * Partagé par les trois actions qui consomment ce défi (code 2FA, demande et confirmation par e-mail).
 */
export async function loadPendingChallengeUser(): Promise<User | null> {
  const challenge = await readPendingMfaChallenge();
  if (!challenge) return null;

  const user = await drizzleAdminUserRepository.findById(challenge.userId);
  if (!user || user.sessionVersion !== challenge.sessionVersion) {
    await clearPendingMfaChallenge();
    return null;
  }
  return user;
}
