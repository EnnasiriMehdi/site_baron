import type { Metadata } from "next";

import { ChangePassword, requireAdminSession, TotpDisable, TotpEnrollment } from "@/features/admin-auth";

export const metadata: Metadata = {
  title: "Sécurité",
  robots: { index: false, follow: false },
};

export default async function AdminSecurityPage() {
  // Session seule : cette page est le seul endroit accessible tant que la 2FA n'est pas configurée.
  const admin = await requireAdminSession();

  return (
    <section aria-labelledby="security-title" className="max-w-lg">
      <h1 id="security-title" className="text-2xl font-bold">
        Sécurité du compte
      </h1>
      <p className="mt-2 text-(--color-text-muted)">Connecté en tant que {admin.email}.</p>

      {!admin.totpEnabled && (
        <p
          role="status"
          className="mt-6 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-4 text-sm"
        >
          La double authentification est obligatoire. Configurez-la sur votre téléphone pour accéder à
          l&apos;administration.
        </p>
      )}

      {admin.totpEnabled && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Mot de passe</h2>
          <div className="mt-3">
            <ChangePassword />
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Double authentification</h2>
        <div className="mt-3">{admin.totpEnabled ? <TotpDisable /> : <TotpEnrollment />}</div>
      </div>
    </section>
  );
}
