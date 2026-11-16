import { describe, expect, it } from "vitest";

import type { EmailCodeRepository, NewEmailCode } from "@/features/admin-auth/email-code-repository";
import {
  createEmailCodeService,
  EMAIL_CODE_COOLDOWN_MS,
  EMAIL_CODE_MAX_ATTEMPTS,
  EMAIL_CODE_TTL_MS,
} from "@/features/admin-auth/email-code-service";
import type { EmailCode } from "@/lib/db/schema";

const T0 = new Date("2026-11-11T12:00:00Z");
const later = (ms: number) => new Date(T0.getTime() + ms);

// Faux dépôt en mémoire : mêmes garanties que le dépôt Drizzle (un seul code actif par usage).
function fakeRepository() {
  let nextId = 1;
  const rows: EmailCode[] = [];
  const repository: EmailCodeRepository = {
    async replace(code: NewEmailCode) {
      const kept = rows.filter((r) => !(r.userId === code.userId && r.purpose === code.purpose));
      rows.length = 0;
      rows.push(...kept, { ...code, id: nextId++, attempts: 0, usedAt: null });
    },
    async findLatest(userId, purpose) {
      return rows.filter((r) => r.userId === userId && r.purpose === purpose).at(-1);
    },
    async incrementAttempts(id) {
      const row = rows.find((r) => r.id === id);
      if (row) row.attempts += 1;
    },
    async markUsed(id, at) {
      const row = rows.find((r) => r.id === id);
      if (row) row.usedAt = at;
    },
  };
  return { repository, rows };
}

describe("createEmailCodeService", () => {
  it("accepte le bon code une fois, puis le refuse (usage unique)", async () => {
    const service = createEmailCodeService(fakeRepository().repository);
    const code = await service.issue(1, "mfa_reset", T0);

    expect(code).not.toBeNull();
    expect(await service.verify(1, "mfa_reset", code!, later(1000))).toBe(true);
    expect(await service.verify(1, "mfa_reset", code!, later(2000))).toBe(false);
  });

  it("tolère la casse et l'absence de tiret", async () => {
    const service = createEmailCodeService(fakeRepository().repository);
    const code = await service.issue(1, "password_reset", T0);

    expect(await service.verify(1, "password_reset", code!.toLowerCase().replace("-", ""), later(1000))).toBe(true);
  });

  it("refuse un mauvais code", async () => {
    const service = createEmailCodeService(fakeRepository().repository);
    await service.issue(1, "mfa_reset", T0);

    expect(await service.verify(1, "mfa_reset", "AAAA-AAAA", later(1000))).toBe(false);
  });

  it("refuse un code expiré", async () => {
    const service = createEmailCodeService(fakeRepository().repository);
    const code = await service.issue(1, "mfa_reset", T0);

    expect(await service.verify(1, "mfa_reset", code!, later(EMAIL_CODE_TTL_MS))).toBe(false);
  });

  it("invalide le code après trop d'essais, même avec le bon code ensuite", async () => {
    const service = createEmailCodeService(fakeRepository().repository);
    const code = await service.issue(1, "mfa_reset", T0);

    for (let i = 0; i < EMAIL_CODE_MAX_ATTEMPTS; i += 1) {
      expect(await service.verify(1, "mfa_reset", "AAAA-AAAA", later(1000))).toBe(false);
    }
    expect(await service.verify(1, "mfa_reset", code!, later(2000))).toBe(false);
  });

  it("n'émet pas de nouveau code pendant le délai minimal", async () => {
    const service = createEmailCodeService(fakeRepository().repository);
    await service.issue(1, "mfa_reset", T0);

    expect(await service.issue(1, "mfa_reset", later(EMAIL_CODE_COOLDOWN_MS - 1))).toBeNull();
    expect(await service.issue(1, "mfa_reset", later(EMAIL_CODE_COOLDOWN_MS))).not.toBeNull();
  });

  it("un nouveau code remplace l'ancien", async () => {
    const service = createEmailCodeService(fakeRepository().repository);
    const first = await service.issue(1, "mfa_reset", T0);
    const second = await service.issue(1, "mfa_reset", later(EMAIL_CODE_COOLDOWN_MS));

    expect(await service.verify(1, "mfa_reset", first!, later(EMAIL_CODE_COOLDOWN_MS + 1000))).toBe(false);
    expect(await service.verify(1, "mfa_reset", second!, later(EMAIL_CODE_COOLDOWN_MS + 2000))).toBe(true);
  });

  it("un code d'un usage ne sert pas pour un autre usage", async () => {
    const service = createEmailCodeService(fakeRepository().repository);
    const code = await service.issue(1, "password_reset", T0);

    expect(await service.verify(1, "mfa_reset", code!, later(1000))).toBe(false);
  });
});
