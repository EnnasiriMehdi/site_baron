type MascotProps = {
  className?: string;
  /** Nom accessible uniquement sur la première occurrence de la page ; sinon purement décoratif. */
  labelled?: boolean;
};

/*
 * Mascotte maison, en SVG inline : aucune dépendance, aucune requête réseau, couleurs tirées
 * des tokens (pas de valeur de marque en dur ailleurs). Un personnage illustré et assumé comme tel
 * ne prétend jamais être une vraie photo d'équipe — contrairement à une photo de banque d'images,
 * ça ne ment à personne (CLAUDE.md, 7bis.2 : pas de photos de banque d'images pour un service d'urgence).
 */
export function Mascot({ className, labelled = false }: MascotProps) {
  return (
    <svg
      viewBox="0 0 120 140"
      className={className}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? "Nova, la mascotte de Nova Chauffage, une flamme souriante bleue et rouge" : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      {/* Corps : flamme rouge (chauffage) */}
      <path
        d="M60 8c18 24 34 44 34 66a34 34 0 1 1-68 0c0-22 16-42 34-66Z"
        fill="var(--color-accent)"
      />
      {/* Cœur bleu (climatisation) : les deux couleurs de la marque dans un seul personnage */}
      <path
        d="M60 46c9 13 16 23 16 34a16 16 0 1 1-32 0c0-11 7-21 16-34Z"
        fill="var(--color-primary)"
      />
      {/* Visage */}
      <circle cx="48" cy="92" r="7" fill="var(--color-surface)" />
      <circle cx="72" cy="92" r="7" fill="var(--color-surface)" />
      <circle cx="49.5" cy="93.5" r="3" fill="var(--color-text)" />
      <circle cx="73.5" cy="93.5" r="3" fill="var(--color-text)" />
      <path
        d="M49 105q11 9 22 0"
        stroke="var(--color-surface)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="39" cy="101" r="4.5" fill="var(--color-accent-soft)" />
      <circle cx="81" cy="101" r="4.5" fill="var(--color-accent-soft)" />
    </svg>
  );
}
