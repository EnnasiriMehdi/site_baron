import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendSecurityAlertInBackground } = vi.hoisted(() => ({
  sendSecurityAlertInBackground: vi.fn(),
}));

vi.mock("@/features/admin-auth/recovery-mailing", () => ({ sendSecurityAlertInBackground }));

import { allowMfaAttempt } from "@/features/admin-auth/mfa-attempt-guard";
import { MFA_MAX_ATTEMPTS } from "@/features/admin-auth/mfa-rate-limit";

describe("allowMfaAttempt", () => {
  beforeEach(() => {
    sendSecurityAlertInBackground.mockClear();
  });

  it("n'envoie aucune alerte tant que le plafond n'est pas dépassé", () => {
    for (let i = 0; i < MFA_MAX_ATTEMPTS; i += 1) {
      expect(allowMfaAttempt(201, "admin@example.test")).toBe(true);
    }

    expect(sendSecurityAlertInBackground).not.toHaveBeenCalled();
  });

  it("envoie UNE alerte au premier refus, pas à chaque tentative suivante", () => {
    for (let i = 0; i < MFA_MAX_ATTEMPTS; i += 1) allowMfaAttempt(202, "admin@example.test");

    expect(allowMfaAttempt(202, "admin@example.test")).toBe(false);
    expect(allowMfaAttempt(202, "admin@example.test")).toBe(false);
    expect(allowMfaAttempt(202, "admin@example.test")).toBe(false);

    expect(sendSecurityAlertInBackground).toHaveBeenCalledTimes(1);
    expect(sendSecurityAlertInBackground).toHaveBeenCalledWith("admin@example.test", "mfa_locked");
  });
});
