import { siteConfig } from "@/config/site";
import { IconPhone } from "@/components/ui/icons";

/*
 * Barre d'appel fixe, visible uniquement sur mobile (CLAUDE.md, 7bis.1).
 * La hauteur réservée dans globals.css (padding-bottom du body) évite tout CLS et tout
 * recouvrement de contenu, y compris du pied de page.
 */
export function MobileCallBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-(--color-border) bg-(--color-surface) p-3 sm:hidden">
      <a
        href={siteConfig.phone.href}
        className="flex min-h-11 items-center justify-center gap-2 rounded-(--radius-md) bg-(--color-accent) px-4 font-semibold text-(--color-accent-contrast)"
      >
        <IconPhone className="h-5 w-5 shrink-0" />
        <span className="truncate">Appeler : {siteConfig.phone.display}</span>
      </a>
    </div>
  );
}
