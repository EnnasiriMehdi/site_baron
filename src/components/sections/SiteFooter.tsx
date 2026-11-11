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
        <p>Mentions légales · Politique de confidentialité</p>
      </div>
    </footer>
  );
}
