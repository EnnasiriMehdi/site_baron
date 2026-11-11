import { describe, expect, it } from "vitest";

import {
  generateRecoveryCodes,
  looksLikeRecoveryCode,
  normalizeRecoveryCode,
} from "@/features/admin-auth/recovery-codes";

describe("recovery-codes", () => {
  it("génère 8 codes uniques au format XXXXX-XXXXX", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    for (const code of codes) expect(code).toMatch(/^[A-Z0-9]{5}-[A-Z0-9]{5}$/);
  });

  it("n'utilise aucun caractère ambigu (0/O, 1/I/L)", () => {
    const codes = generateRecoveryCodes(50);
    expect(codes.join("")).not.toMatch(/[01ILO]/);
  });

  it("reconnaît un code de secours quelle que soit la casse ou les espaces", () => {
    expect(looksLikeRecoveryCode(" abcde-23456 ")).toBe(true);
    expect(normalizeRecoveryCode(" abcde-23456 ")).toBe("ABCDE-23456");
  });

  it("ne confond pas un code TOTP à 6 chiffres avec un code de secours", () => {
    expect(looksLikeRecoveryCode("123456")).toBe(false);
  });
});
