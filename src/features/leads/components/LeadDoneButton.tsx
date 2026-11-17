import { setLeadDoneAction } from "../actions";

// Formulaire serveur (aucun JavaScript client) : un bouton qui marque la demande traitée, ou la rouvre.
export function LeadDoneButton({ leadId, done }: { leadId: number; done: boolean }) {
  return (
    <form action={setLeadDoneAction}>
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="done" value={done ? "false" : "true"} />
      <button
        type="submit"
        className="min-h-11 rounded-(--radius-md) border border-(--color-primary) px-4 font-semibold text-(--color-primary) hover:bg-(--color-primary-soft)"
      >
        {done ? "Rouvrir la demande" : "Marquer comme traitée"}
      </button>
    </form>
  );
}
