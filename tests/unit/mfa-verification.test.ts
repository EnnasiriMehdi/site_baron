import { TOTP, Secret } from "otpauth";
import { describe, expect, it, vi } from "vitest";

import { hashPassword } from "@/features/admin-auth/password";
import { generateTotpSecret } from "@/features/admin-auth/totp";
import { verifySecondFactor } from "@/features/admin-auth/mfa-verification";
import type { RecoveryCodeRepository } from "@/features/admin-auth/recovery-code-repository";
import type { RecoveryCode, User } from "@/lib/db/schema";

const NOW = new Date("2026-10-06T12:00:00Z");

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: "admin@exemple.fr",
    passwordHash: "unused",
    role: "admin",
    failedLoginCount: 0,
    lockedUntil: null,
    totpSecret: null,
    totpEnabledAt: null,
    sessionVersion: 0,
    createdAt: NOW,
    ...overrides,
  };
}

function currentCodeFor(secret: string): string {
  return new TOTP({ secret: Secret.fromBase32(secret), digits: 6, period: 30 }).generate();
}

function fakeRecoveryRepo(codes: RecoveryCode[]): RecoveryCodeRepository & { markUsed: ReturnType<typeof vi.fn> } {
  return {
    replaceAll: vi.fn(async () => undefined),
    findUnused: vi.fn(async () => codes.filter((c) => !c.usedAt)),
    markUsed: vi.fn(async () => undefined),
    deleteAll: vi.fn(async () => undefined),
  };
}

describe("verifySecondFactor", () => {
  it("refuse si le 2FA n'est pas activé", async () => {
    const user = makeUser();
    const result = await verifySecondFactor(user, "123456", fakeRecoveryRepo([]));
    expect(result).toBe("invalid");
  });

  it("accepte un code TOTP valide", async () => {
    const secret = generateTotpSecret();
    const user = makeUser({ totpSecret: secret, totpEnabledAt: NOW });

    const result = await verifySecondFactor(user, currentCodeFor(secret), fakeRecoveryRepo([]));

    expect(result).toBe("totp");
  });

  it("refuse un code TOTP invalide", async () => {
    const secret = generateTotpSecret();
    const user = makeUser({ totpSecret: secret, totpEnabledAt: NOW });

    const result = await verifySecondFactor(user, "000000", fakeRecoveryRepo([]));

    expect(result).toBe("invalid");
  });

  it("accepte un code de secours valide et le marque utilisé", async () => {
    const plainCode = "ABCDE-23456";
    const codeHash = await hashPassword(plainCode);
    const repo = fakeRecoveryRepo([
      { id: 7, userId: 1, codeHash, usedAt: null, createdAt: NOW },
    ]);
    const user = makeUser({ totpSecret: generateTotpSecret(), totpEnabledAt: NOW });

    const result = await verifySecondFactor(user, plainCode, repo);

    expect(result).toBe("recovery");
    expect(repo.markUsed).toHaveBeenCalledWith(7);
  });

  it("refuse un code de secours déjà marqué comme utilisé", async () => {
    const plainCode = "ABCDE-23456";
    const codeHash = await hashPassword(plainCode);
    const repo = fakeRecoveryRepo([
      { id: 7, userId: 1, codeHash, usedAt: NOW, createdAt: NOW },
    ]);
    const user = makeUser({ totpSecret: generateTotpSecret(), totpEnabledAt: NOW });

    const result = await verifySecondFactor(user, plainCode, repo);

    expect(result).toBe("invalid");
  });
});
