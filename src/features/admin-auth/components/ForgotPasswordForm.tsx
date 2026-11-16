"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  confirmPasswordResetAction,
  requestPasswordResetAction,
  type PasswordResetConfirmState,
  type PasswordResetRequestState,
} from "../recovery-actions";

const initialRequestState: PasswordResetRequestState = null;
const initialConfirmState: PasswordResetConfirmState = null;

const inputClass =
  "mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-3 text-base text-(--color-text) focus-visible:outline-3 focus-visible:outline-(--color-primary)";
const buttonClass =
  "min-h-11 rounded-(--radius-md) bg-(--color-primary) px-4 py-3 font-semibold text-(--color-primary-contrast) disabled:opacity-60";

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.[0]) return null;
  return (
    <p id={id} className="mt-1 text-sm text-(--color-danger)">
      {messages[0]}
    </p>
  );
}

export function ForgotPasswordForm() {
  const [requestState, requestAction, requestPending] = useActionState(
    requestPasswordResetAction,
    initialRequestState,
  );
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmPasswordResetAction,
    initialConfirmState,
  );

  if (confirmState && "success" in confirmState) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-semibold text-(--color-primary)">Mot de passe modifié.</p>
        <Link href="/admin/login" className="underline">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  // Étape 2 : code reçu + nouveau mot de passe. Le message reste le même que l'adresse existe ou non.
  if (requestState && "step" in requestState) {
    const errors = confirmState && "fieldErrors" in confirmState ? confirmState.fieldErrors : undefined;
    const globalError = confirmState && "error" in confirmState ? confirmState.error : undefined;

    return (
      <form action={confirmAction} className="flex flex-col gap-4">
        <p className="text-sm text-(--color-text-muted)">
          Si un compte existe pour cette adresse, un code vient d&apos;y être envoyé (valable 15 minutes).
        </p>
        <input type="hidden" name="email" value={requestState.email} />

        <div>
          <label htmlFor="reset-code" className="block text-sm font-medium">
            Code reçu par e-mail
          </label>
          <input
            id="reset-code"
            name="code"
            type="text"
            autoComplete="one-time-code"
            required
            spellCheck={false}
            aria-invalid={Boolean(errors?.code)}
            aria-describedby={errors?.code ? "reset-code-error" : undefined}
            className={`${inputClass} text-center uppercase tracking-widest`}
          />
          <FieldError id="reset-code-error" messages={errors?.code} />
        </div>

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium">
            Nouveau mot de passe (12 caractères minimum)
          </label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={Boolean(errors?.newPassword)}
            aria-describedby={errors?.newPassword ? "new-password-error" : undefined}
            className={inputClass}
          />
          <FieldError id="new-password-error" messages={errors?.newPassword} />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium">
            Confirmer le mot de passe
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={Boolean(errors?.confirmPassword)}
            aria-describedby={errors?.confirmPassword ? "confirm-password-error" : undefined}
            className={inputClass}
          />
          <FieldError id="confirm-password-error" messages={errors?.confirmPassword} />
        </div>

        <div role="alert" aria-live="assertive" className="min-h-6">
          {globalError && <p className="text-sm text-(--color-danger)">{globalError}</p>}
        </div>

        <button type="submit" disabled={confirmPending} className={buttonClass}>
          {confirmPending ? "Enregistrement…" : "Changer le mot de passe"}
        </button>
      </form>
    );
  }

  // Étape 1 : adresse e-mail du compte.
  const requestError = requestState && "error" in requestState ? requestState.error : undefined;
  return (
    <form action={requestAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium">
          Adresse e-mail du compte
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          spellCheck={false}
          aria-invalid={Boolean(requestError)}
          aria-describedby={requestError ? "forgot-error" : undefined}
          className={inputClass}
        />
      </div>

      <div role="alert" aria-live="assertive" className="min-h-6">
        {requestError && (
          <p id="forgot-error" className="text-sm text-(--color-danger)">
            {requestError}
          </p>
        )}
      </div>

      <button type="submit" disabled={requestPending} className={buttonClass}>
        {requestPending ? "Envoi…" : "Recevoir un code par e-mail"}
      </button>
    </form>
  );
}
