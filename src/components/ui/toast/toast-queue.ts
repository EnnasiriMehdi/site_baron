/*
 * Logique pure de la file de toasts (aucun React, aucun navigateur) : testable seule, et réutilisable par
 * n'importe quel adaptateur. Le toast lui-même est dans ToastProvider.tsx / ToastItem.tsx.
 */
export type ToastKind = "error" | "warning" | "success" | "info";

export type Toast = { id: number; kind: ToastKind; message: string };

// Au-delà, les toasts attendent leur tour dans la file : on ne couvre jamais la page.
export const MAX_VISIBLE_TOASTS = 3;

export const SUCCESS_DISMISS_MS = 6000;

/*
 * Erreurs et avertissements restent jusqu'au clic : l'admin doit les voir (WCAG 2.2.1 : pas de message important
 * qui disparaît sans action). Succès et infos se ferment seuls. `null` = reste jusqu'à la fermeture manuelle.
 */
export function autoDismissMs(kind: ToastKind): number | null {
  return kind === "success" || kind === "info" ? SUCCESS_DISMISS_MS : null;
}

export function addToast(toasts: Toast[], toast: Toast): Toast[] {
  return [...toasts, toast];
}

export function removeToast(toasts: Toast[], id: number): Toast[] {
  return toasts.filter((toast) => toast.id !== id);
}

// Seuls les premiers sont affichés (donc seuls eux démarrent leur minuteur) ; les autres sont en file d'attente.
export function visibleToasts(toasts: Toast[]): Toast[] {
  return toasts.slice(0, MAX_VISIBLE_TOASTS);
}

// Temps restant après une pause (survol ou focus) : on ne repart pas de zéro à chaque passage de la souris.
export function remainingAfterPause(remainingMs: number, startedAt: number, now: number): number {
  return Math.max(0, remainingMs - (now - startedAt));
}

/*
 * État complet de la file, pour un useReducer : l'identifiant du prochain toast est attribué ICI (fonction pure),
 * pas dans un composant, ce qui évite tout compteur modifié pendant le rendu.
 */
export type QueueState = { toasts: Toast[]; nextId: number };

export const initialQueueState: QueueState = { toasts: [], nextId: 1 };

export type QueueAction = { type: "add"; kind: ToastKind; message: string } | { type: "dismiss"; id: number };

export function queueReducer(state: QueueState, action: QueueAction): QueueState {
  if (action.type === "add") {
    const toast: Toast = { id: state.nextId, kind: action.kind, message: action.message };
    return { toasts: addToast(state.toasts, toast), nextId: state.nextId + 1 };
  }
  return { ...state, toasts: removeToast(state.toasts, action.id) };
}
