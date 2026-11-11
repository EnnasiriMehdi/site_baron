"use client";

import { useActionState } from "react";

import { loginAction, type LoginFormState } from "../actions";

const initialState: LoginFormState = null;

const inputClass =
  "mt-1 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-3 text-base text-(--color-text) focus-visible:outline-3 focus-visible:outline-(--color-primary)";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" aria-describedby={state?.error ? "login-error" : undefined}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          spellCheck={false}
          aria-invalid={Boolean(state?.fieldErrors?.email)}
          aria-describedby={state?.fieldErrors?.email ? "email-error" : undefined}
          className={inputClass}
        />
        {state?.fieldErrors?.email && (
          <p id="email-error" className="mt-1 text-sm text-(--color-danger)">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state?.fieldErrors?.password)}
          aria-describedby={state?.fieldErrors?.password ? "password-error" : undefined}
          className={inputClass}
        />
        {state?.fieldErrors?.password && (
          <p id="password-error" className="mt-1 text-sm text-(--color-danger)">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>

      <div role="alert" aria-live="assertive" className="min-h-6">
        {state?.error && (
          <p id="login-error" className="text-sm text-(--color-danger)">
            {state.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-(--radius-md) bg-(--color-primary) px-4 py-3 font-semibold text-(--color-primary-contrast) disabled:opacity-60"
      >
        {pending ? "Connexion en cours…" : "Se connecter"}
      </button>
    </form>
  );
}
