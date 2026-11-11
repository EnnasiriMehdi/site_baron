"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import {
  confirmTotpEnrollmentAction,
  startTotpEnrollmentAction,
  type EnrollmentConfirmState,
  type EnrollmentStartState,
} from "../mfa-enrollment-actions";

const initialStartState: EnrollmentStartState = null;
const initialConfirmState: EnrollmentConfirmState = null;

export function TotpEnrollment() {
  const [startState, startAction, startPending] = useActionState(
    async () => startTotpEnrollmentAction(),
    initialStartState,
  );
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmTotpEnrollmentAction,
    initialConfirmState,
  );
  const [acknowledged, setAcknowledged] = useState(false);

  // Étape 3 : les codes de secours ne sont affichés qu'une seule fois, juste après l'activation.
  if (confirmState && "recoveryCodes" in confirmState) {
    if (!acknowledged) {
      return (
        <div className="flex flex-col gap-4">
          <p className="font-semibold text-(--color-primary)">Double authentification activée.</p>
          <div>
            <p className="text-sm text-(--color-text-muted)">
              Notez ces codes de secours dans un endroit sûr. Chacun ne fonctionne qu&apos;une fois et
              permet de vous reconnecter si vous perdez votre téléphone. Ils ne seront plus jamais
              affichés.
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm">
              {confirmState.recoveryCodes.map((code) => (
                <li key={code} className="rounded-(--radius-md) border border-(--color-border) px-3 py-2">
                  {code}
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setAcknowledged(true)}
            className="min-h-11 self-start rounded-(--radius-md) bg-(--color-primary) px-4 py-3 font-semibold text-(--color-primary-contrast)"
          >
            J&apos;ai noté mes codes
          </button>
        </div>
      );
    }
    return <p className="text-(--color-text-muted)">Double authentification active. Rechargez la page.</p>;
  }

  // Étape 2 : code affiché par l'application, à confirmer.
  if (startState && "qrDataUrl" in startState) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-(--color-text-muted)">
          Scannez ce QR code avec votre application d&apos;authentification (Google Authenticator,
          1Password, Authy…), puis saisissez le code à 6 chiffres qu&apos;elle affiche.
        </p>
        <Image
          src={startState.qrDataUrl}
          alt="QR code d'inscription à la double authentification"
          width={200}
          height={200}
          unoptimized
          className="rounded-(--radius-md) border border-(--color-border)"
        />
        <p className="text-sm text-(--color-text-muted)">
          Impossible de scanner ? Saisissez cette clé manuellement : <code>{startState.secret}</code>
        </p>
        <form action={confirmAction} className="flex flex-col gap-3">
          <label htmlFor="confirm-code" className="block text-sm font-medium">
            Code à 6 chiffres
          </label>
          <input
            id="confirm-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            aria-invalid={Boolean(confirmState && "error" in confirmState)}
            aria-describedby={confirmState && "error" in confirmState ? "confirm-error" : undefined}
            className="w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-3 text-center text-lg tracking-widest"
          />
          <div role="alert" aria-live="assertive" className="min-h-6">
            {confirmState && "error" in confirmState && (
              <p id="confirm-error" className="text-sm text-(--color-danger)">
                {confirmState.error}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={confirmPending}
            className="min-h-11 self-start rounded-(--radius-md) bg-(--color-primary) px-4 py-3 font-semibold text-(--color-primary-contrast) disabled:opacity-60"
          >
            {confirmPending ? "Vérification…" : "Activer la double authentification"}
          </button>
        </form>
      </div>
    );
  }

  // Étape 1 : point de départ.
  return (
    <form action={startAction} className="flex flex-col gap-3">
      <p className="text-(--color-text-muted)">
        La double authentification n&apos;est pas activée. Elle ajoute un code à 6 chiffres, en plus du
        mot de passe, à chaque connexion.
      </p>
      {startState && "error" in startState && (
        <p className="text-sm text-(--color-danger)">{startState.error}</p>
      )}
      <button
        type="submit"
        disabled={startPending}
        className="min-h-11 self-start rounded-(--radius-md) bg-(--color-primary) px-4 py-3 font-semibold text-(--color-primary-contrast) disabled:opacity-60"
      >
        {startPending ? "Préparation…" : "Activer la double authentification"}
      </button>
    </form>
  );
}
