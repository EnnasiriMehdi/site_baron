import type { ReactNode } from "react";

type IconBadgeProps = {
  children: ReactNode;
  tone?: "primary" | "accent";
};

const toneClasses = {
  primary: "bg-(--color-primary-soft) text-(--color-primary)",
  accent: "bg-(--color-accent-soft) text-(--color-accent)",
};

// Pastille d'icône réutilisable : couleur toujours tirée des tokens, jamais codée en dur ici.
export function IconBadge({ children, tone = "primary" }: IconBadgeProps) {
  return (
    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${toneClasses[tone]}`}>
      <span className="h-6 w-6">{children}</span>
    </span>
  );
}
