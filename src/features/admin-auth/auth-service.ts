import "server-only";

import { getDummyHash, verifyPassword } from "./password";
import type { AdminUserRepository } from "./user-repository";

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;

export type AuthResult =
  | { ok: true; userId: number; sessionVersion: number; mfaRequired: boolean }
  | { ok: false; reason: "invalid_credentials" | "locked" };

/*
 * Règle métier de connexion : vérification du mot de passe et verrouillage temporaire du compte.
 * Ne sait rien de HTTP, des cookies ou des formulaires (SRP).
 */
export function createAuthService(repository: AdminUserRepository) {
  return {
    async authenticate(email: string, password: string, now: Date = new Date()): Promise<AuthResult> {
      const user = await repository.findByEmail(email);

      if (!user) {
        // Même durée de réponse qu'un compte existant, pour ne pas révéler les adresses valides.
        await verifyPassword(await getDummyHash(), password);
        return { ok: false, reason: "invalid_credentials" };
      }

      if (user.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
        await verifyPassword(await getDummyHash(), password);
        return { ok: false, reason: "locked" };
      }

      const valid = await verifyPassword(user.passwordHash, password);

      if (!valid) {
        const failures = user.failedLoginCount + 1;
        const shouldLock = failures >= MAX_FAILED_ATTEMPTS;
        await repository.updateLockout(user.id, {
          failedLoginCount: shouldLock ? 0 : failures,
          lockedUntil: shouldLock ? new Date(now.getTime() + LOCK_DURATION_MS) : null,
        });
        return { ok: false, reason: "invalid_credentials" };
      }

      if (user.failedLoginCount > 0 || user.lockedUntil) {
        await repository.updateLockout(user.id, { failedLoginCount: 0, lockedUntil: null });
      }

      return {
        ok: true,
        userId: user.id,
        sessionVersion: user.sessionVersion,
        mfaRequired: Boolean(user.totpSecret && user.totpEnabledAt),
      };
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
