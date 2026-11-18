"use client";

import { useMemo, useReducer } from "react";

import { ToastItem } from "./ToastItem";
import { ToastContext, type ToastApi } from "./toast";
import { initialQueueState, queueReducer, visibleToasts, type ToastKind } from "./toast-queue";

/*
 * ADAPTATEUR MAISON du contrat `ToastApi` (toast.ts) : garde la file de toasts en mémoire et les affiche.
 * Monté une seule fois dans un layout (app/admin/layout.tsx) : il survit aux changements de page, donc un toast
 * encore affiché reste visible après une navigation. Un rechargement complet de la page l'efface.
 *
 * Deux zones d'annonce toujours présentes, en position fixe (aucun décalage de mise en page) :
 * les erreurs et avertissements sont annoncés tout de suite (`alert`), le reste poliment (`status`).
 * En haut de l'écran, sur mobile comme sur grand écran.
 * Pour utiliser une bibliothèque à la place, remplacer ce fichier par un fournisseur qui alimente `ToastContext`.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, dispatch] = useReducer(queueReducer, initialQueueState);

  const toast = useMemo<ToastApi>(() => {
    const push = (kind: ToastKind) => (message: string) => dispatch({ type: "add", kind, message });
    return { error: push("error"), warning: push("warning"), success: push("success"), info: push("info") };
  }, []);

  const dismiss = useMemo(() => (id: number) => dispatch({ type: "dismiss", id }), []);

  const shown = visibleToasts(queue.toasts);
  const urgent = shown.filter((item) => item.kind === "error" || item.kind === "warning");
  const calm = shown.filter((item) => item.kind === "success" || item.kind === "info");

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 p-4 sm:inset-x-auto sm:right-0 sm:w-96">
        <div role="alert">
          {urgent.map((item) => (
            <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
          ))}
        </div>
        <div role="status">
          {calm.map((item) => (
            <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
