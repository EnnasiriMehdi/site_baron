"use client";

import { useActionState } from "react";

import { requestMfaEmailResetAction, type MfaRecoveryState } from "../recovery-actions";

const initialState: MfaRecoveryState = null;

// Sous le formulaire de code 2FA : "téléphone perdu" → envoie un code à l'e-mail du compte.
export function MfaEmailRecoveryRequest() {
  const [state, formAction, pending] = useActionState(async () => requestMfaEmailResetAction(), initialState);

  return (
    <form action={formAction} className="mt-6 border-t border-(--color-border) pt-4">
      <p className="text-sm text-(--color-text-muted)">
        Plus accès à votre application d&apos;authentification ? Recevez un code par e-mail pour
        réinitialiser la double authentification.
      </p>
      <div role="alert" aria-live="assertive" className="min-h-6">
        {state?.error && <p className="mt-2 text-sm text-(--color-danger)">{state.error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 min-h-11 rounded-(--radius-md) border border-(--color-border) px-4 py-3 font-medium disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Recevoir un code par e-mail"}
      </button>
    </form>
  );
}
