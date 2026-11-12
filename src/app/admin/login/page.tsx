import type { Metadata } from "next";
import Link from "next/link";

import { FORGOT_PASSWORD_PATH, LoginForm } from "@/features/admin-auth";

export const metadata: Metadata = {
  title: "Connexion administrateur",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main id="contenu" className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold">Connexion administrateur</h1>
        <LoginForm />
        <p className="mt-4 text-sm">
          <Link href={FORGOT_PASSWORD_PATH} className="inline-block min-h-11 py-2 underline">
            Mot de passe oublié ?
          </Link>
        </p>
      </div>
    </main>
  );
}
