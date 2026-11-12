import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LOGIN_PATH, MfaEmailRecoveryRequest, MfaForm, readPendingMfaChallenge } from "@/features/admin-auth";

export const metadata: Metadata = {
  title: "Code de vérification",
  robots: { index: false, follow: false },
};

export default async function MfaVerifyPage() {
  // Pas de défi en attente (expiré ou absent) : repartir du début plutôt que d'afficher un formulaire inutile.
  const challenge = await readPendingMfaChallenge();
  if (!challenge) redirect(LOGIN_PATH);

  return (
    <main id="contenu" className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">Vérification en deux étapes</h1>
        <p className="mb-6 text-sm text-(--color-text-muted)">
          Mot de passe confirmé. Saisissez le code de votre application d&apos;authentification.
        </p>
        <MfaForm />
        <MfaEmailRecoveryRequest />
      </div>
    </main>
  );
}
