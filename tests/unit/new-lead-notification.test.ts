import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";
import {
  buildNewLeadLimitEmail,
  buildNewLeadNotificationEmail,
} from "@/features/notifications/templates/new-lead-notification";

describe("e-mail de nouvelle demande", () => {
  it("a un sujet fixe et pointe vers la demande dans l'admin", () => {
    const email = buildNewLeadNotificationEmail({ leadId: 42, attachmentCount: 0 });

    expect(email.subject).toBe(`${siteConfig.name} — Nouvelle demande d'intervention`);
    expect(email.text).toContain("/admin/leads/42");
    expect(email.html).toContain("/admin/leads/42");
  });

  it("n'indique les pièces jointes que s'il y en a", () => {
    expect(buildNewLeadNotificationEmail({ leadId: 1, attachmentCount: 0 }).text).not.toContain("Pièces jointes");
    expect(buildNewLeadNotificationEmail({ leadId: 1, attachmentCount: 3 }).text).toContain("Pièces jointes : 3.");
  });

  it("ne contient aucune donnée du visiteur : seul un identifiant et un nombre entrent dans le gabarit", () => {
    // Le type d'entrée ne laisse passer que { leadId, attachmentCount } : aucun texte libre ne peut y figurer.
    const email = buildNewLeadNotificationEmail({ leadId: 7, attachmentCount: 1 });

    expect(email.text).not.toMatch(/<script|javascript:/i);
    expect(email.html).not.toMatch(/<script/i);
  });
});

describe("e-mail de plafond atteint", () => {
  it("renvoie vers la liste des demandes, sans identifiant", () => {
    const email = buildNewLeadLimitEmail();

    expect(email.text).toContain("/admin/leads");
    expect(email.text).toContain("suspendues");
  });
});
