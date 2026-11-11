"use client";

import { useActionState } from "react";

import { verifyMfaAction, type MfaFormState } from "../mfa-actions";

const initialState: MfaFormState = null;

export function MfaForm() {
  const [state, formAction, pending] = useActionState(verifyMfaAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" aria-describedby={state?.error ? "mfa-error" : undefined}>
      <div>
        <label htmlFor="code" className="block text-sm font-medium">
          Code de l&apos;application d&apos;authentification
        </label>
        <p className="mt-1 text-sm text-(--color-text-muted)">
          Ou un de vos codes de secours au format XXXXX-XXXXX.
        </p>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="text"
          autoComplete="one-time-code"
          autoFocus
          required
          aria-invalid={Boolean(state?.error)}
          aria-describedby={state?.error ? "mfa-error" : undefined}
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-3 text-center text-lg tracking-widest text-(--color-text)"
        />
      </div>

      <div role="alert" aria-live="assertive" className="min-h-6">
        {state?.error && (
          <p id="mfa-error" className="text-sm text-(--color-danger)">
            {state.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-(--radius-md) bg-(--color-primary) px-4 py-3 font-semibold text-(--color-primary-contrast) disabled:opacity-60"
      >
        {pending ? "Vérification…" : "Valider"}
      </button>
    </form>
  );
}
