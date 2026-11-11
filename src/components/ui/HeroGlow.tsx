/*
 * Fond décoratif, purement visuel : deux formes douces aux couleurs de la marque, pour que le hero
 * ne soit pas un simple bloc de texte sur fond uni. Zéro impact perf (SVG inline, pas de requête).
 */
export function HeroGlow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true" className={className}>
      <circle cx="330" cy="60" r="130" fill="var(--color-primary-soft)" />
      <circle cx="70" cy="260" r="110" fill="var(--color-accent-soft)" />
    </svg>
  );
}
