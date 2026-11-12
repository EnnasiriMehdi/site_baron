"use client";

import { useActionState } from "react";

import { confirmMfaEmailResetAction, type MfaRecoveryState } from "../recovery-actions";

const initialState: MfaRecoveryState = null;

export function MfaEmailRecoveryForm() {
  const [state, formAction, pending] = useActionState(confirmMfaEmailResetAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email-code" className="block text-sm font-medium">
          Code reçu par e-mail
        </label>
        <input
          id="email-code"
          name="code"
          type="text"
          autoComplete="one-time-code"
          autoFocus
          required
          spellCheck={false}
          aria-invalid={Boolean(state?.error)}
          aria-describedby={state?.error ? "email-code-error" : undefined}
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-3 text-center text-lg uppercase tracking-widest text-(--color-text)"
        />
      </div>

      <div role="alert" aria-live="assertive" className="min-h-6">
        {state?.error && (
          <p id="email-code-error" className="text-sm text-(--color-danger)">
            {state.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-(--radius-md) bg-(--color-primary) px-4 py-3 font-semibold text-(--color-primary-contrast) disabled:opacity-60"
      >
        {pending ? "Vérification…" : "Valider et réinitialiser"}
      </button>
    </form>
  );
}
