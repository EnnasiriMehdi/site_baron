import Link from "next/link";

import { logoutAction, requireAdminSession } from "@/features/admin-auth";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  // Vérification côté serveur à chaque rendu : ne jamais se fier au seul proxy.
  // Session seule ici : la page /admin/security doit rester accessible pour enrôler la 2FA ;
  // chaque autre page appelle requireAdmin(), qui exige la 2FA.
  const admin = await requireAdminSession();

  return (
    <>
      <header className="border-b border-(--color-border) bg-(--color-surface)">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex items-center gap-4">
            <p className="font-semibold">Administration</p>
            {admin.totpEnabled && (
              <>
                <Link href="/admin/leads" className="text-sm underline">
                  Demandes
                </Link>
                <Link href="/admin/realisations" className="text-sm underline">
                  Réalisations
                </Link>
                <Link href="/admin/articles" className="text-sm underline">
                  Articles
                </Link>
                <Link href="/admin/security" className="text-sm underline">
                  Sécurité
                </Link>
              </>
            )}
          </nav>
          <form action={logoutAction}>
            <button
              type="submit"
              className="min-h-11 rounded-(--radius-md) border border-(--color-border) px-4 py-2 font-medium"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      <main id="contenu" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
