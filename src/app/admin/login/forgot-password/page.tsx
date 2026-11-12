import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm, LOGIN_PATH } from "@/features/admin-auth";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main id="contenu" className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">Mot de passe oublié</h1>
        <p className="mb-6 text-sm text-(--color-text-muted)">
          Recevez un code par e-mail pour choisir un nouveau mot de passe. La double authentification
          reste demandée à la connexion.
        </p>
        <ForgotPasswordForm />
        <p className="mt-4 text-sm">
          <Link href={LOGIN_PATH} className="inline-block min-h-11 py-2 underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
