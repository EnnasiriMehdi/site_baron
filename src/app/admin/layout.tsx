import type { Metadata } from "next";

// Toute la zone admin est exclue de l'indexation (CLAUDE.md, section 5.1 et 8.1).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col">{children}</div>;
}
