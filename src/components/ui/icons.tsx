/*
 * Icônes décoratives, en SVG inline : aucune dépendance, aucun JavaScript, couleur héritée
 * via currentColor (donc pilotée par les tokens de src/styles/tokens.css). Toujours utilisées
 * à côté d'un texte qui porte le sens : elles restent aria-hidden (CLAUDE.md, section 7).
 */
type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

export function IconAlertTriangle({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 9v5" />
      <path d="M12 17.5h.01" />
    </svg>
  );
}

export function IconRefresh({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 12a8 8 0 0 1 14.3-5" />
      <path d="M20 4v5h-5" />
      <path d="M20 12a8 8 0 0 1-14.3 5" />
      <path d="M4 20v-5h5" />
    </svg>
  );
}

export function IconWrench({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M14.7 6.3a4 4 0 0 0-5.1 5.1L4 17l3 3 5.6-5.6a4 4 0 0 0 5.1-5.1l-2.8 2.8-2.2-2.2 2.8-2.8Z" />
    </svg>
  );
}

export function IconClock({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 1.8" />
    </svg>
  );
}

export function IconFlame({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 2.5c1 2.5-.5 4-1.6 5.3C9.2 9 8.5 10.3 8.5 12a3.5 3.5 0 0 0 7 0c0-1-.3-1.7-.8-2.4.9.9 1.3 2 1.3 3.2a4.5 4.5 0 0 1-9 0c0-3.5 2.8-5 3.8-7.5.5-1.2.8-1.9 1.2-2.8Z" />
    </svg>
  );
}

export function IconSnowflake({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 2.5v19" />
      <path d="M3.5 7.25 20.5 16.75" />
      <path d="M3.5 16.75 20.5 7.25" />
      <path d="m8.5 4.5 3.5 2 3.5-2" />
      <path d="m8.5 19.5 3.5-2 3.5 2" />
    </svg>
  );
}

export function IconDroplet({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 2.5c3.4 4.8 6.8 9 6.8 12.3a6.8 6.8 0 1 1-13.6 0c0-3.3 3.4-7.5 6.8-12.3Z" />
    </svg>
  );
}

export function IconKey({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="7" cy="15" r="3.3" />
      <path d="M9.3 12.7 18 4" />
      <path d="M15.5 6.5 18 4l2.2 2.2" />
      <path d="M16.8 9.2 19 7" />
    </svg>
  );
}

export function IconBolt({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

export function IconShieldCheck({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function IconMapPin({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21s-6.5-5.9-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.1-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.1" />
    </svg>
  );
}

export function IconEuro({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M19 7.5a7 7 0 1 0 0 9" />
      <path d="M3.5 10h8" />
      <path d="M3.5 14h7" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconChevronLeft({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

export function IconChevronRight({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function IconDocument({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="M9.5 13h5M9.5 16.5h5" />
    </svg>
  );
}

export function IconDownload({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 19.5h16" />
    </svg>
  );
}

// Seule icône à ne PAS suivre currentColor/les tokens : logo Google, couleurs de marque réelles et
// fixes (pas une couleur Nova), utilisé uniquement pour sourcer honnêtement "avis Google".
export function IconGoogleLogo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A10.98 10.98 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.85Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A10.98 10.98 0 0 0 2.18 7.05l3.66 2.85C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export function IconStar({ className, filled = true }: IconProps & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2Z" />
    </svg>
  );
}

export function IconQuote({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M9.5 6C6.46 6 4 8.46 4 11.5c0 2.76 2.01 5.04 4.64 5.45a7.1 7.1 0 0 1-2.4 3.35 1 1 0 0 0 .96 1.7A9.1 9.1 0 0 0 13 13.5V11.5C13 8.46 11.76 6 9.5 6Z" />
      <path d="M18.5 6C15.46 6 13 8.46 13 11.5c0 2.76 2.01 5.04 4.64 5.45a7.1 7.1 0 0 1-2.4 3.35 1 1 0 0 0 .96 1.7A9.1 9.1 0 0 0 22 13.5V11.5C22 8.46 20.76 6 18.5 6Z" />
    </svg>
  );
}

export function IconImage({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m4 18 5.5-5.5a2 2 0 0 1 2.8 0L20 20" />
    </svg>
  );
}

export function IconHelpCircle({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.3a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2-2.4 3.6" />
      <path d="M12 17.5h.01" />
    </svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

export function IconPhone({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8Z" />
    </svg>
  );
}
