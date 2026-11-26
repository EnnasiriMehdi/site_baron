"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: ReactNode;
  // Libellé affiché pendant l'envoi ; sans lui, le libellé normal reste affiché.
  pendingLabel?: string;
  // primary : action principale ; outline : action secondaire ; danger : action destructive ou à confirmer ;
  // primaryOutline : appel à l'action du site public (bordure et texte de la couleur principale).
  variant?: "primary" | "outline" | "danger" | "primaryOutline";
  // Désactivation imposée par le formulaire (ex. : photos en cours d'allègement), en plus de l'envoi en cours.
  disabled?: boolean;
  className?: string;
};

const BASE = "min-h-11 rounded-(--radius-md) py-3 disabled:opacity-60";
const VARIANTS = {
  primary: "bg-(--color-primary) px-4 font-semibold text-(--color-primary-contrast)",
  outline: "border border-(--color-border) px-4 font-medium",
  danger: "border border-(--color-danger) px-4 font-semibold text-(--color-danger)",
  primaryOutline: "border border-(--color-primary) px-6 font-semibold text-(--color-primary)",
} as const;

// État d'envoi lu dans le <form> parent (useFormStatus) : aucune prop `pending` à faire descendre.
export function SubmitButton({ children, pendingLabel, variant = "primary", disabled, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const classes = `${BASE} ${VARIANTS[variant]}${className ? ` ${className}` : ""}`;

  return (
    <button type="submit" disabled={pending || disabled} className={classes}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
