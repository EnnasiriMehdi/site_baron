import "server-only";

import { redirect } from "next/navigation";

import { drizzleAdminUserRepository } from "./user-repository";
import { readSession } from "./session";

export const LOGIN_PATH = "/admin/login";
export const MFA_VERIFY_PATH = "/admin/login/verify";

export type AuthenticatedAdmin = { userId: number; email: string; totpEnabled: boolean };

async function authenticatedAdminOrNull(): Promise<AuthenticatedAdmin | null> {
  const session = await readSession();
  if (!session) return null;

  const user = await drizzleAdminUserRepository.findById(session.userId);
  if (!user) return null;

  return { userId: user.id, email: user.email, totpEnabled: Boolean(user.totpSecret && user.totpEnabledAt) };
}

/*
 * Garde à appeler dans chaque layout, page ou Server Action protégée. Le proxy ne suffit pas seul
 * (CLAUDE.md, section 8.1) : on vérifie le jeton ET que le compte existe encore en base.
 * Redirige vers la connexion : adapté aux pages, pas aux routes qui renvoient un fichier ou du JSON.
 */
export async function requireAdmin(): Promise<AuthenticatedAdmin> {
  const admin = await authenticatedAdminOrNull();
  if (!admin) redirect(LOGIN_PATH);
  return admin;
}

/*
 * Même vérification, pour les route handlers de type API/fichier : renvoie null plutôt que de
 * rediriger, pour que l'appelant réponde 401 au lieu d'une redirection HTML incohérente.
 */
export async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin | null> {
  return authenticatedAdminOrNull();
}
