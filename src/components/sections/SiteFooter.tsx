import Link from "next/link";

import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    // pb-24 réserve la place de la barre d'appel mobile fixe (MobileCallBar) pour qu'elle ne la recouvre pas.
    <footer className="border-t border-(--color-border) py-8 pb-24 sm:pb-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-(--color-text-muted)">
        <p className="font-semibold text-(--color-text)">{siteConfig.name}</p>
        <p>{siteConfig.contactName}</p>
        <p>
          <a href={siteConfig.phone.href} className="underline">
            {siteConfig.phone.display}
          </a>
          {" · "}
          <a href={`mailto:${siteConfig.email}`} className="underline">
            {siteConfig.email}
          </a>
        </p>
        <p>
          {siteConfig.legalName} · SIRET {siteConfig.siret}
        </p>
        <p>
          {siteConfig.address.street}, {siteConfig.address.postalCode} {siteConfig.address.city}
        </p>
        <nav aria-label="Informations légales" className="flex flex-wrap gap-x-4">
          <Link href="/mentions-legales" className="inline-flex min-h-11 items-center underline">
            Mentions légales
          </Link>
          <Link href="/politique-de-confidentialite" className="inline-flex min-h-11 items-center underline">
            Politique de confidentialité
          </Link>
        </nav>
      </div>
    </footer>
  );
}
