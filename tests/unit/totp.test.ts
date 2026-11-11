import { TOTP, Secret } from "otpauth";
import { describe, expect, it } from "vitest";

import { buildTotpUri, generateTotpSecret, verifyTotpCode } from "@/features/admin-auth/totp";

const EMAIL = "admin@exemple.fr";

function currentCodeFor(secret: string): string {
  return new TOTP({ secret: Secret.fromBase32(secret), digits: 6, period: 30 }).generate();
}

describe("totp", () => {
  it("génère un secret base32 différent à chaque appel", () => {
    const a = generateTotpSecret();
    const b = generateTotpSecret();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Z2-7]+$/);
  });

  it("accepte le code courant généré à partir du même secret", () => {
    const secret = generateTotpSecret();
    expect(verifyTotpCode(EMAIL, secret, currentCodeFor(secret))).toBe(true);
  });

  it("refuse un code au hasard", () => {
    const secret = generateTotpSecret();
    expect(verifyTotpCode(EMAIL, secret, "000000")).toBe(false);
  });

  it("refuse le code d'un autre secret", () => {
    const secret = generateTotpSecret();
    const otherSecret = generateTotpSecret();
    expect(verifyTotpCode(EMAIL, secret, currentCodeFor(otherSecret))).toBe(false);
  });

  it("construit une URI otpauth:// exploitable par une application", () => {
    const uri = buildTotpUri(EMAIL, generateTotpSecret());
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain(encodeURIComponent(EMAIL));
  });
});
