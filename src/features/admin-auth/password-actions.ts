"use server";

import { z } from "zod";

import { requireAdmin } from "./guards";
import { hashPassword, verifyPassword } from "./password";
import { changePasswordSchema } from "./schema";
import { createSession } from "./session";
import { drizzleAdminUserRepository } from "./user-repository";

export type ChangePasswordState =
  | { error?: string; fieldErrors?: { currentPassword?: string[]; newPassword?: string[]; confirmPassword?: string[] } }
  | { success: true }
  | null;

const CURRENT_PASSWORD_INVALID = "Mot de passe actuel incorrect.";

// Revérifie la session (CLAUDE.md, section 8.1) et le mot de passe actuel avant toute écriture :
// une session valide ne suffit pas à elle seule à changer le mot de passe.
export async function changePasswordAction(
  _previous: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const admin = await requireAdmin();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return { fieldErrors };
  }

  const user = await drizzleAdminUserRepository.findById(admin.userId);
  if (!user) return { error: CURRENT_PASSWORD_INVALID };

  const valid = await verifyPassword(user.passwordHash, parsed.data.currentPassword);
  if (!valid) return { error: CURRENT_PASSWORD_INVALID };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await drizzleAdminUserRepository.updatePasswordHash(admin.userId, passwordHash);
  // Le changement a révoqué toutes les sessions (autres appareils, éventuelle copie volée) :
  // on en rouvre une pour l'admin qui vient de le faire, qui reste ainsi connecté.
  await createSession(admin.userId);

  return { success: true };
}
