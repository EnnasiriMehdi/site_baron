import { describe, expect, it } from "vitest";

import { buildAdminSecurityAlertEmail } from "@/features/notifications/templates/admin-security-alert";

describe("e-mail d'alerte de sécurité admin", () => {
  it("décrit un blocage 2FA sans parler de récupération réussie", () => {
    const email = buildAdminSecurityAlertEmail({ kind: "mfa_locked" });

    expect(email.text).toContain("codes de double authentification erronés");
    expect(email.text).toContain("suspendue");
    expect(email.text).not.toContain("via un code envoyé par e-mail");
    expect(email.html).toContain("erronés");
  });

  it("décrit un verrouillage de connexion", () => {
    const email = buildAdminSecurityAlertEmail({ kind: "login_locked" });

    expect(email.text).toContain("mots de passe erronés");
    expect(email.text).toContain("une fois par jour");
  });

  it("garde le texte des alertes de récupération", () => {
    const email = buildAdminSecurityAlertEmail({ kind: "mfa_reset" });

    expect(email.text).toContain("La double authentification de l'administration a été réinitialisée via un code envoyé par e-mail.");
    expect(email.text).toContain("Si c'est bien vous, aucune action n'est nécessaire.");
  });
});
