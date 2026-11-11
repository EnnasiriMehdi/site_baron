"use client";

import { useActionState } from "react";

import { changePasswordAction, type ChangePasswordState } from "../password-actions";

const initialState: ChangePasswordState = null;

export function ChangePassword() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  if (state && "success" in state) {
    return <p className="text-(--color-text-muted)">Mot de passe mis à jour.</p>;
  }

  const fieldErrors = state && "fieldErrors" in state ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium">
          Mot de passe actuel
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(fieldErrors?.currentPassword)}
          aria-describedby={fieldErrors?.currentPassword ? "currentPassword-error" : undefined}
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2"
        />
        {fieldErrors?.currentPassword && (
          <p id="currentPassword-error" className="mt-1 text-sm text-(--color-danger)">
            {fieldErrors.currentPassword[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium">
          Nouveau mot de passe
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          aria-invalid={Boolean(fieldErrors?.newPassword)}
          aria-describedby={fieldErrors?.newPassword ? "newPassword-error" : "newPassword-hint"}
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2"
        />
        {fieldErrors?.newPassword ? (
          <p id="newPassword-error" className="mt-1 text-sm text-(--color-danger)">
            {fieldErrors.newPassword[0]}
          </p>
        ) : (
          <p id="newPassword-hint" className="mt-1 text-sm text-(--color-text-muted)">
            12 caractères minimum.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium">
          Confirmer le nouveau mot de passe
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(fieldErrors?.confirmPassword)}
          aria-describedby={fieldErrors?.confirmPassword ? "confirmPassword-error" : undefined}
          className="mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2"
        />
        {fieldErrors?.confirmPassword && (
          <p id="confirmPassword-error" className="mt-1 text-sm text-(--color-danger)">
            {fieldErrors.confirmPassword[0]}
          </p>
        )}
      </div>

      <div role="alert" aria-live="assertive" className="min-h-6">
        {state && "error" in state && <p className="text-sm text-(--color-danger)">{state.error}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 self-start rounded-(--radius-md) bg-(--color-primary) px-5 py-3 font-semibold text-(--color-primary-contrast) disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}
