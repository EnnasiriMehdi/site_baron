"use client";

import { useCallback, useEffect, useRef } from "react";

import { autoDismissMs, remainingAfterPause, type Toast, type ToastKind } from "./toast-queue";

const LABELS: Record<ToastKind, string> = {
  error: "Erreur",
  warning: "Attention",
  success: "Succès",
  info: "Information",
};

// Couleur + libellé écrit : l'information ne repose jamais sur la couleur seule (CLAUDE.md, section 7).
const ACCENT_CLASSES: Record<ToastKind, string> = {
  error: "border-l-(--color-danger) text-(--color-danger)",
  warning: "border-l-(--color-warning) text-(--color-warning)",
  success: "border-l-(--color-success) text-(--color-success)",
  info: "border-l-(--color-primary) text-(--color-primary)",
};

type ToastItemProps = { toast: Toast; onDismiss: (id: number) => void };

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const duration = autoDismissMs(toast.kind);
  const remaining = useRef(duration ?? 0);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    if (duration === null || timer.current) return;
    startedAt.current = Date.now();
    timer.current = setTimeout(() => onDismiss(toast.id), remaining.current);
  }, [duration, onDismiss, toast.id]);

  const pause = useCallback(() => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    remaining.current = remainingAfterPause(remaining.current, startedAt.current, Date.now());
  }, []);

  // Le minuteur démarre à l'affichage (un toast en file d'attente n'est pas monté, donc ne décompte pas).
  useEffect(() => {
    start();
    return pause;
  }, [start, pause]);

  return (
    <div
      onMouseEnter={pause}
      onMouseLeave={start}
      onFocus={pause}
      onBlur={start}
      className={`pointer-events-auto mt-2 flex items-start justify-between gap-2 rounded-(--radius-md) border border-(--color-border) border-l-4 bg-(--color-surface) py-2 pr-1 pl-4 shadow-lg ${ACCENT_CLASSES[toast.kind]}`}
    >
      <p className="py-1.5 text-sm text-(--color-text)">
        <strong className="mr-1 font-bold">{LABELS[toast.kind]} :</strong>
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fermer la notification"
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-(--radius-md) text-xl text-(--color-text-muted) hover:text-(--color-text)"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
