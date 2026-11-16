import { describe, expect, it } from "vitest";

import {
  clearMfaAttempts,
  consumeMfaAttempt,
  MFA_MAX_ATTEMPTS,
  MFA_WINDOW_MS,
} from "@/features/admin-auth/mfa-rate-limit";

// Les identifiants sont distincts d'un test à l'autre : le limiteur est un singleton de module.
describe("plafond 2FA par compte", () => {
  it("refuse l'essai suivant le plafond, quelle que soit l'IP (la clé est le compte)", () => {
    const user = 101;
    for (let i = 0; i < MFA_MAX_ATTEMPTS; i += 1) {
      expect(consumeMfaAttempt(user, 0).allowed).toBe(true);
    }
    expect(consumeMfaAttempt(user, 1000).allowed).toBe(false);
  });

  it("n'affecte pas un autre compte", () => {
    for (let i = 0; i < MFA_MAX_ATTEMPTS; i += 1) consumeMfaAttempt(102, 0);

    expect(consumeMfaAttempt(102, 1).allowed).toBe(false);
    expect(consumeMfaAttempt(103, 1).allowed).toBe(true);
  });

  it("autorise de nouveau à la fin de la fenêtre", () => {
    for (let i = 0; i < MFA_MAX_ATTEMPTS; i += 1) consumeMfaAttempt(104, 0);

    expect(consumeMfaAttempt(104, MFA_WINDOW_MS - 1).allowed).toBe(false);
    expect(consumeMfaAttempt(104, MFA_WINDOW_MS).allowed).toBe(true);
  });

  it("repart à zéro après un succès ou une récupération par e-mail", () => {
    consumeMfaAttempt(105, 0);
    consumeMfaAttempt(105, 1);

    clearMfaAttempts(105);

    for (let i = 0; i < MFA_MAX_ATTEMPTS; i += 1) {
      expect(consumeMfaAttempt(105, 2).allowed).toBe(true);
    }
    expect(consumeMfaAttempt(105, 3).allowed).toBe(false);
  });

  it("signale le premier refus seulement (une alerte par blocage)", () => {
    for (let i = 0; i < MFA_MAX_ATTEMPTS; i += 1) consumeMfaAttempt(106, 0);

    expect(consumeMfaAttempt(106, 1)).toEqual({ allowed: false, firstBlock: true });
    expect(consumeMfaAttempt(106, 2)).toEqual({ allowed: false, firstBlock: false });
    expect(consumeMfaAttempt(106, 3)).toEqual({ allowed: false, firstBlock: false });
  });

  it("peut alerter de nouveau après une levée du blocage (récupération)", () => {
    for (let i = 0; i < MFA_MAX_ATTEMPTS; i += 1) consumeMfaAttempt(107, 0);
    expect(consumeMfaAttempt(107, 1)).toEqual({ allowed: false, firstBlock: true });

    clearMfaAttempts(107);
    for (let i = 0; i < MFA_MAX_ATTEMPTS; i += 1) consumeMfaAttempt(107, 2);

    expect(consumeMfaAttempt(107, 3)).toEqual({ allowed: false, firstBlock: true });
  });
});
