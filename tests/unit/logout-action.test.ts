import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSession: vi.fn(),
  destroySession: vi.fn(),
  revokeSessions: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/client-ip", () => ({ clientIp: async () => "203.0.113.1" }));
vi.mock("@/features/admin-auth/auth-instance", () => ({ authService: {} }));
vi.mock("@/features/admin-auth/login-lockout-alert", () => ({ alertLoginLocked: vi.fn() }));
vi.mock("@/features/admin-auth/mfa-session", () => ({ createPendingMfaChallenge: vi.fn() }));
vi.mock("@/features/admin-auth/session", () => ({
  readSession: mocks.readSession,
  destroySession: mocks.destroySession,
  createSession: vi.fn(),
}));
vi.mock("@/features/admin-auth/user-repository", () => ({
  drizzleAdminUserRepository: { revokeSessions: mocks.revokeSessions },
}));

import { logoutAction } from "@/features/admin-auth/actions";

describe("logoutAction", () => {
  beforeEach(() => {
    mocks.readSession.mockReset().mockResolvedValue({ userId: 1, sessionVersion: 3 });
    mocks.destroySession.mockReset().mockResolvedValue(undefined);
    mocks.revokeSessions.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("déconnexion complète : pas de signalement", async () => {
    const result = await logoutAction();

    expect(result).toEqual({ partial: false, redirectTo: "/admin/login" });
    expect(mocks.revokeSessions).toHaveBeenCalledWith(1, 3);
  });

  it("déconnexion partielle quand la révocation des autres sessions échoue", async () => {
    mocks.revokeSessions.mockRejectedValue(new Error("database is locked"));

    const result = await logoutAction();

    expect(result.partial).toBe(true);
    expect(result.redirectTo).toBe("/admin/login");
  });

  it("supprime toujours la session de cet appareil, même si la révocation échoue", async () => {
    mocks.revokeSessions.mockRejectedValue(new Error("database is locked"));

    await logoutAction();

    expect(mocks.destroySession).toHaveBeenCalledTimes(1);
  });

  it("sans session valide : rien à révoquer, pas de signalement", async () => {
    mocks.readSession.mockResolvedValue(null);

    const result = await logoutAction();

    expect(result.partial).toBe(false);
    expect(mocks.revokeSessions).not.toHaveBeenCalled();
  });

  it("ne journalise que le nom de l'erreur", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.revokeSessions.mockRejectedValue(new Error("secret interne"));

    await logoutAction();

    expect(JSON.stringify(logged.mock.calls)).not.toContain("secret interne");
  });
});
