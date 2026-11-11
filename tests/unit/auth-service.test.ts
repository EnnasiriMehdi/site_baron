import { describe, expect, it, vi } from "vitest";

import { createAuthService, LOCK_DURATION_MS, MAX_FAILED_ATTEMPTS } from "@/features/admin-auth/auth-service";
import { hashPassword } from "@/features/admin-auth/password";
import type { AdminUserRepository } from "@/features/admin-auth/user-repository";
import type { User } from "@/lib/db/schema";

const PASSWORD = "mot-de-passe-de-test-long";
const NOW = new Date("2026-10-06T12:00:00Z");

async function makeUser(overrides: Partial<User> = {}): Promise<User> {
  return {
    id: 1,
    email: "admin@exemple.fr",
    passwordHash: await hashPassword(PASSWORD),
    role: "admin",
    failedLoginCount: 0,
    lockedUntil: null,
    totpSecret: null,
    totpEnabledAt: null,
    createdAt: NOW,
    ...overrides,
  };
}

// Faux dépôt (DIP) : le service est testé sans base de données.
function fakeRepository(user?: User) {
  const repo = {
    findByEmail: vi.fn(async (email: string) => (user && user.email === email ? user : undefined)),
    findById: vi.fn(async () => user),
    updateLockout: vi.fn(async () => undefined),
    updatePasswordHash: vi.fn(async () => undefined),
    setPendingTotpSecret: vi.fn(async () => undefined),
    enableTotp: vi.fn(async () => undefined),
    disableTotp: vi.fn(async () => undefined),
  };
  return repo satisfies AdminUserRepository & Record<string, unknown>;
}

describe("authService.authenticate", () => {
  it("accepte un mot de passe correct et réinitialise les échecs", async () => {
    const user = await makeUser({ failedLoginCount: 2 });
    const repo = fakeRepository(user);

    const result = await createAuthService(repo).authenticate(user.email, PASSWORD, NOW);

    expect(result).toEqual({ ok: true, userId: 1, mfaRequired: false });
    expect(repo.updateLockout).toHaveBeenCalledWith(1, { failedLoginCount: 0, lockedUntil: null });
  });

  it("signale que le 2FA est requis quand il est activé", async () => {
    const user = await makeUser({ totpSecret: "SECRET", totpEnabledAt: NOW });
    const repo = fakeRepository(user);

    const result = await createAuthService(repo).authenticate(user.email, PASSWORD, NOW);

    expect(result).toEqual({ ok: true, userId: 1, mfaRequired: true });
  });

  it("refuse un mauvais mot de passe et incrémente le compteur", async () => {
    const user = await makeUser({ failedLoginCount: 1 });
    const repo = fakeRepository(user);

    const result = await createAuthService(repo).authenticate(user.email, "mauvais", NOW);

    expect(result).toEqual({ ok: false, reason: "invalid_credentials" });
    expect(repo.updateLockout).toHaveBeenCalledWith(1, { failedLoginCount: 2, lockedUntil: null });
  });

  it("verrouille le compte après le nombre maximal d'échecs", async () => {
    const user = await makeUser({ failedLoginCount: MAX_FAILED_ATTEMPTS - 1 });
    const repo = fakeRepository(user);

    await createAuthService(repo).authenticate(user.email, "mauvais", NOW);

    expect(repo.updateLockout).toHaveBeenCalledWith(1, {
      failedLoginCount: 0,
      lockedUntil: new Date(NOW.getTime() + LOCK_DURATION_MS),
    });
  });

  it("refuse la connexion pendant le verrouillage, même avec le bon mot de passe", async () => {
    const user = await makeUser({ lockedUntil: new Date(NOW.getTime() + 60_000) });
    const repo = fakeRepository(user);

    const result = await createAuthService(repo).authenticate(user.email, PASSWORD, NOW);

    expect(result).toEqual({ ok: false, reason: "locked" });
    expect(repo.updateLockout).not.toHaveBeenCalled();
  });

  it("accepte à nouveau après expiration du verrouillage", async () => {
    const user = await makeUser({ lockedUntil: new Date(NOW.getTime() - 1) });
    const repo = fakeRepository(user);

    const result = await createAuthService(repo).authenticate(user.email, PASSWORD, NOW);

    expect(result.ok).toBe(true);
  });

  it("répond de la même façon pour un e-mail inconnu", async () => {
    const repo = fakeRepository(undefined);

    const result = await createAuthService(repo).authenticate("inconnu@exemple.fr", PASSWORD, NOW);

    expect(result).toEqual({ ok: false, reason: "invalid_credentials" });
    expect(repo.updateLockout).not.toHaveBeenCalled();
  });
});
