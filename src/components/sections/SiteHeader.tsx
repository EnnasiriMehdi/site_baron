import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { IconPhone } from "@/components/ui/icons";

// "/#ancre" plutôt que "#ancre" : reste utilisable depuis une autre page (ex. /blog), tout en
// gardant le défilement doux sans rechargement une fois déjà sur l'accueil (même document).
const navLinks = [
  { href: "/#besoins", label: "Votre besoin" },
  { href: "/#services", label: "Nos interventions" },
  { href: "/#avis", label: "Avis" },
  { href: "/#pourquoi", label: "Pourquoi nous" },
  { href: "/#zones", label: "Zones d'intervention" },
  { href: "/blog", label: "Blog" },
  { href: "/#contact", label: "Contact" },
];

/*
 * Navigation en ancres, toujours visible (pas de menu caché derrière un bouton) : c'est la seule
 * page du site pour l'instant, donc la nav doit rester simple à parcourir au clavier comme au doigt.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-(--color-border) bg-(--color-surface)">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/#top" className="flex items-center gap-2 font-semibold text-(--color-primary)">
          <Image src="/logo.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0" />
          <span>
            {siteConfig.name}
            <span className="hidden text-xs font-normal text-(--color-text-muted) sm:block">
              Particuliers &amp; professionnels
            </span>
          </span>
        </Link>
        {/* Icône seule sur mobile (la barre d'appel fixe prend déjà le relais) ; texte complet dès sm:. */}
        <a
          href={siteConfig.phone.href}
          aria-label={`Appeler : ${siteConfig.phone.display}`}
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-(--radius-md) bg-(--color-accent) px-3 font-semibold text-(--color-accent-contrast) sm:px-4"
        >
          <IconPhone className="h-5 w-5 shrink-0" />
          <span className="hidden sm:inline">Appeler : {siteConfig.phone.display}</span>
        </a>
      </div>
      <nav aria-label="Navigation principale" className="border-t border-(--color-border)">
        <ul className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-2 text-sm font-medium whitespace-nowrap">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="inline-flex min-h-11 items-center">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
