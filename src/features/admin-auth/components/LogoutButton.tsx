"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { useToast } from "@/components/ui/toast/toast";

import { logoutAction } from "../actions";

export const LOGOUT_PARTIAL_MESSAGE =
  "Déconnexion partielle : cet appareil est déconnecté, mais les autres sessions n'ont pas pu être fermées. Elles expirent d'elles-mêmes sous 2 heures.";

export function LogoutButton() {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await logoutAction();
      // Le toast survit à la navigation : le fournisseur est dans app/admin/layout.tsx.
      if (result.partial) toast.warning(LOGOUT_PARTIAL_MESSAGE);
      router.push(result.redirectTo);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="min-h-11 rounded-(--radius-md) border border-(--color-border) px-4 py-2 font-medium disabled:opacity-60"
    >
      Se déconnecter
    </button>
  );
}
