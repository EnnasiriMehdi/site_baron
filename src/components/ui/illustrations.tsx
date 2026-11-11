/*
 * Illustrations de section, en SVG inline (même logique que Mascot.tsx et HeroGlow.tsx) : aucune
 * dépendance, zéro requête réseau, couleurs tirées des tokens. Des scènes conceptuelles (radiateur,
 * climatiseur, robinet), jamais des photos de personnes ou de véhicules — pas de confusion possible
 * avec une vraie photo d'équipe (CLAUDE.md, 6bis et 7bis.2).
 */
type IllustrationProps = { className?: string };

export function HeatingIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden="true">
      <rect width="200" height="140" rx="16" fill="var(--color-accent-soft)" />
      {/* Ondes de chaleur */}
      <path
        d="M70 44c6-8-6-12 0-20M98 44c6-8-6-12 0-20M126 44c6-8-6-12 0-20"
        stroke="var(--color-accent)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
      {/* Radiateur */}
      <rect x="54" y="58" width="92" height="48" rx="6" fill="var(--color-surface)" />
      <rect x="64" y="66" width="8" height="32" rx="3" fill="var(--color-accent)" />
      <rect x="80" y="66" width="8" height="32" rx="3" fill="var(--color-accent)" />
      <rect x="96" y="66" width="8" height="32" rx="3" fill="var(--color-accent)" />
      <rect x="112" y="66" width="8" height="32" rx="3" fill="var(--color-accent)" />
      <rect x="128" y="66" width="8" height="32" rx="3" fill="var(--color-accent)" />
      {/* Pieds */}
      <rect x="60" y="106" width="6" height="10" rx="2" fill="var(--color-text-muted)" />
      <rect x="134" y="106" width="6" height="10" rx="2" fill="var(--color-text-muted)" />
    </svg>
  );
}

export function CoolingIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden="true">
      <rect width="200" height="140" rx="16" fill="var(--color-primary-soft)" />
      {/* Climatiseur mural */}
      <rect x="46" y="34" width="108" height="32" rx="10" fill="var(--color-surface)" />
      <rect x="58" y="46" width="84" height="6" rx="3" fill="var(--color-primary)" opacity="0.5" />
      {/* Flux d'air frais */}
      <path
        d="M66 72c-6 10 10 14 4 26M100 72c-6 10 10 14 4 26M134 72c-6 10 10 14 4 26"
        stroke="var(--color-primary)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}

export function PlumbingIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden="true">
      <rect width="200" height="140" rx="16" fill="var(--color-primary-soft)" />
      {/* Robinet */}
      <rect x="92" y="28" width="16" height="30" rx="4" fill="var(--color-surface)" />
      <path
        d="M100 32h28a10 10 0 0 1 10 10v8"
        stroke="var(--color-surface)"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      {/* Goutte */}
      <path
        d="M138 58c7 10 13 18 13 25a13 13 0 1 1-26 0c0-7 6-15 13-25Z"
        fill="var(--color-primary)"
      />
      {/* Clé à molette, accent */}
      <path
        d="M58 86a12 12 0 0 0-15 15l-14 14 7 7 14-14a12 12 0 0 0 15-15l-8 8-7-7 8-8Z"
        fill="var(--color-accent)"
      />
    </svg>
  );
}

/*
 * Visuel de la section confiance : un badge/bouclier, pour ancrer visuellement l'argumentaire
 * sans dupliquer les pastilles d'icônes déjà présentes sur chaque point.
 */
export function TrustBadgeIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <path
        d="M60 6 104 22v32c0 30-18 52-44 60-26-8-44-30-44-60V22Z"
        fill="var(--color-primary)"
      />
      <path
        d="M38 60l16 16 28-32"
        stroke="var(--color-surface)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
