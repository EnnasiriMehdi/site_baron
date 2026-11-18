"use client";

import { createContext, useContext } from "react";

/*
 * LE CONTRAT des toasts : tout le code qui veut afficher un toast ne dépend QUE de `useToast()`, jamais de
 * l'implémentation. Pour passer à une bibliothèque (sonner, react-toastify…), on réécrit uniquement le fournisseur
 * (ToastProvider.tsx), qui alimente ce même contexte avec les fonctions de la bibliothèque. Voir knowledge.md.
 *
 * Usage : `const toast = useToast(); toast.error("Message");`
 */
export interface ToastApi {
  error(message: string): void;
  warning(message: string): void;
  success(message: string): void;
  info(message: string): void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const toast = useContext(ToastContext);
  if (!toast) {
    // Oubli du fournisseur : on le dit clairement plutôt que d'avaler le message en silence.
    throw new Error("useToast() doit être appelé sous un ToastProvider (app/admin/layout.tsx).");
  }
  return toast;
}
