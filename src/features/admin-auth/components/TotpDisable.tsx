"use client";

import { useActionState } from "react";

import { disableTotpAction, type DisableMfaState } from "../mfa-enrollment-actions";

const initialState: DisableMfaState = null;

export function TotpDisable() {
  const [state, formAction, pending] = useActionState(disableTotpAction, initialState);

  if (state && "success" in state) {
    return <p className="text-(--color-text-muted)">Double authentification désactivée. Rechargez la page.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-(--color-text-muted)">
        La double authentification est active. Pour la désactiver, confirmez avec un code de votre
        application ou un code de secours.
      </p>
      <label htmlFor="disable-code" className="block text-sm font-medium">
        Code de confirmation
      </label>
      <input
        id="disable-code"
        name="code"
        type="text"
        autoComplete="one-time-code"
        required
        aria-invalid={Boolean(state && "error" in state)}
        aria-describedby={state && "error" in state ? "disable-error" : undefined}
        className="w-full max-w-xs rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-3 text-center tracking-widest"
      />
      <div role="alert" aria-live="assertive" className="min-h-6">
        {state && "error" in state && (
          <p id="disable-error" className="text-sm text-(--color-danger)">
            {state.error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 self-start rounded-(--radius-md) border border-(--color-danger) px-4 py-3 font-semibold text-(--color-danger) disabled:opacity-60"
      >
        {pending ? "Désactivation…" : "Désactiver la double authentification"}
      </button>
    </form>
  );
}
