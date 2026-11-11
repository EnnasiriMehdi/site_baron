import { IconImage } from "@/components/ui/icons";

type ImagePlaceholderProps = {
  className?: string;
  label?: string;
};

/*
 * Emplacement réservé pour une vraie photo, pas encore fournie (CLAUDE.md, section 12 : ne jamais
 * inventer un visuel). À remplacer par next/image (avec dimensions explicites) dès qu'une photo
 * réelle est disponible.
 */
export function ImagePlaceholder({ className, label = "Photo à venir" }: ImagePlaceholderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 border border-dashed border-(--color-border) bg-(--color-surface-muted) text-(--color-text-muted) ${className ?? ""}`}
    >
      <IconImage className="h-8 w-8" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
