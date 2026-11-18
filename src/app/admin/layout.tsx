import type { Metadata } from "next";

import { ToastProvider } from "@/components/ui/toast/ToastProvider";

// Toute la zone admin est exclue de l'indexation (CLAUDE.md, section 5.1 et 8.1).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Le fournisseur de toasts est ici (connexion ET zone protégée) : il reste monté quand on passe de l'une à l'autre.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">{children}</div>
    </ToastProvider>
  );
}
