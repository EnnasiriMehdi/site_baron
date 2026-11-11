import { IconImage } from "@/components/ui/icons";

type BannerPlaceholderProps = {
  className?: string;
  label?: string;
};

/*
 * Fond de bannière en attente d'une vraie photo : contrairement à ImagePlaceholder (cadre discret
 * pour une carte), celui-ci couvre toute une section avec du texte posé par-dessus. Le repère
 * reste discret, en coin, pour ne jamais gêner la lecture du titre (CLAUDE.md, section 12 :
 * ne jamais inventer un visuel — ce cadre dit honnêtement qu'il attend une vraie photo).
 */
export function BannerPlaceholder({ className, label = "Photo de couverture à venir" }: BannerPlaceholderProps) {
  return (
    <div className={`absolute inset-0 -z-10 bg-(--color-surface-muted) ${className ?? ""}`} aria-hidden="true">
      <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm font-medium text-(--color-text-muted)">
        <IconImage className="h-4 w-4" />
        {label}
      </span>
    </div>
  );
}
