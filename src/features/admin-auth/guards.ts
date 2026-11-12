import "server-only";

import { redirect } from "next/navigation";

import { drizzleAdminUserRepository } from "./user-repository";
import { readSession } from "./session";

export const LOGIN_PATH = "/admin/login";
export const MFA_VERIFY_PATH = "/admin/login/verify";
export const MFA_SETUP_PATH = "/admin/security";
export const MFA_RECOVER_PATH = "/admin/login/recover-mfa";
export const FORGOT_PASSWORD_PATH = "/admin/login/forgot-password";

export type AuthenticatedAdmin = { userId: number; email: string; totpEnabled: boolean };

async function authenticatedAdminOrNull(): Promise<AuthenticatedAdmin | null> {
  const session = await readSession();
  if (!session) return null;

  const user = await drizzleAdminUserRepository.findById(session.userId);
  if (!user) return null;

  return { userId: user.id, email: user.email, totpEnabled: Boolean(user.totpSecret && user.totpEnabledAt) };
}

/*
 * Session seule, sans exiger la 2FA. Réservée à ce qui sert justement à (ré)enrôler la 2FA :
 * le layout protégé, la page /admin/security et les actions d'enrôlement. Partout ailleurs,
 * utiliser requireAdmin().
 */
export async function requireAdminSession(): Promise<AuthenticatedAdmin> {
  const admin = await authenticatedAdminOrNull();
  if (!admin) redirect(LOGIN_PATH);
  return admin;
}

/*
 * Garde à appeler dans chaque page ou Server Action protégée. Le proxy ne suffit pas seul
 * (CLAUDE.md, section 8.1) : on vérifie le jeton, que le compte existe encore en base, ET que la
 * 2FA est active. La 2FA est obligatoire : après une récupération par e-mail (qui la réinitialise),
 * l'admin est renvoyé vers l'enrôlement tant qu'il n'a pas configuré son nouveau téléphone.
 * Redirige : adapté aux pages, pas aux routes qui renvoient un fichier ou du JSON.
 */
export async function requireAdmin(): Promise<AuthenticatedAdmin> {
  const admin = await requireAdminSession();
  if (!admin.totpEnabled) redirect(MFA_SETUP_PATH);
  return admin;
}

/*
 * Même vérification, pour les route handlers de type API/fichier : renvoie null plutôt que de
 * rediriger, pour que l'appelant réponde 401 au lieu d'une redirection HTML incohérente.
 */
export async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin | null> {
  const admin = await authenticatedAdminOrNull();
  return admin?.totpEnabled ? admin : null;
}
