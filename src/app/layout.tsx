import type { Metadata, Viewport } from "next";
import "./globals.css";

import { siteConfig } from "@/config/site";
import { fontVariables } from "@/styles/fonts";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Thème clair uniquement par défaut (cf. tokens.css) : une seule couleur, pas de bascule système.
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fontVariables} h-full antialiased`}>
      <body id="top" className="flex min-h-full flex-col">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-(--radius-md) focus:bg-(--color-primary) focus:px-4 focus:py-2 focus:text-(--color-primary-contrast)"
        >
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
