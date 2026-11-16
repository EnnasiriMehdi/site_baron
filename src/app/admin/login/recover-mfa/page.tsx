import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LOGIN_PATH, MfaEmailRecoveryForm, readPendingMfaChallenge } from "@/features/admin-auth";

export const metadata: Metadata = {
  title: "Réinitialiser la double authentification",
  robots: { index: false, follow: false },
};

export default async function RecoverMfaPage() {
  // Seul quelqu'un qui a déjà saisi le bon mot de passe (défi 2FA en attente) arrive ici.
  const challenge = await readPendingMfaChallenge();
  if (!challenge) redirect(LOGIN_PATH);

  return (
    <main id="contenu" className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">Réinitialiser la double authentification</h1>
        <p className="mb-6 text-sm text-(--color-text-muted)">
          Un code vient d&apos;être envoyé à l&apos;adresse e-mail du compte (valable 15 minutes).
          Après validation, vous devrez configurer la double authentification sur votre nouveau
          téléphone.
        </p>
        <MfaEmailRecoveryForm />
      </div>
    </main>
  );
}
