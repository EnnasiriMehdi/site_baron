import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";
import { buildStorageWarningEmail } from "@/features/notifications/templates/storage-warning";

describe("e-mail d'alerte de stockage", () => {
  it("indique le pourcentage et renvoie vers le tableau de bord", () => {
    const email = buildStorageWarningEmail({ percent: 83 });

    expect(email.subject).toContain(siteConfig.name);
    expect(email.text).toContain("83 %");
    expect(email.text).toContain("/admin");
    expect(email.html).toContain("83 %");
  });

  it("borne le pourcentage entre 0 et 100", () => {
    expect(buildStorageWarningEmail({ percent: 140 }).text).toContain("100 %");
    expect(buildStorageWarningEmail({ percent: -5 }).text).toContain("0 %");
  });
});
