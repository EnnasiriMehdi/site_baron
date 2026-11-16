import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendSecurityAlertInBackground } = vi.hoisted(() => ({
  sendSecurityAlertInBackground: vi.fn(),
}));

vi.mock("@/features/admin-auth/recovery-mailing", () => ({ sendSecurityAlertInBackground }));

import { alertLoginLocked } from "@/features/admin-auth/login-lockout-alert";

const DAY_MS = 24 * 60 * 60 * 1000;

// Adresses distinctes d'un test à l'autre : le limiteur est un singleton de module.
describe("alertLoginLocked", () => {
  beforeEach(() => {
    sendSecurityAlertInBackground.mockClear();
  });

  it("envoie l'alerte au premier verrouillage", () => {
    alertLoginLocked("a@exemple.test", 0);

    expect(sendSecurityAlertInBackground).toHaveBeenCalledWith("a@exemple.test", "login_locked");
  });

  it("n'envoie qu'une alerte par 24 h, même si le compte est reverrouillé toutes les 15 min", () => {
    for (let i = 0; i < 96; i += 1) alertLoginLocked("b@exemple.test", i * 15 * 60 * 1000);

    expect(sendSecurityAlertInBackground).toHaveBeenCalledTimes(1);
  });

  it("réenvoie après 24 h", () => {
    alertLoginLocked("c@exemple.test", 0);
    alertLoginLocked("c@exemple.test", DAY_MS);

    expect(sendSecurityAlertInBackground).toHaveBeenCalledTimes(2);
  });
});
