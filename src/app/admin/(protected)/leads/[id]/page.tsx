import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/features/admin-auth";
import { AttachmentGallery, drizzleLeadRepository, LeadDoneButton } from "@/features/leads";

export const metadata: Metadata = {
  title: "Détail de la demande",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });

export default async function AdminLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isInteger(leadId)) notFound();

  const lead = await drizzleLeadRepository.findById(leadId);
  if (!lead) notFound();

  // Vue = pris connaissance. Un outil admin interne, la simplicité prime sur une action explicite séparée.
  if (lead.status === "new") {
    await drizzleLeadRepository.markRead(lead.id);
  }

  return (
    <section aria-labelledby="lead-title" className="max-w-2xl">
      <h1 id="lead-title" className="text-2xl font-bold">
        {lead.name}
      </h1>
      <p className="mt-1 text-sm text-(--color-text-muted)">
        Reçue le {dateFormatter.format(lead.createdAt)}
        {lead.status === "done" && " · Traitée"}
      </p>
      <div className="mt-4">
        <LeadDoneButton leadId={lead.id} done={lead.status === "done"} />
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-(--color-text-muted)">Téléphone</dt>
          <dd>
            <a href={`tel:${lead.phone}`} className="text-(--color-primary) underline">
              {lead.phone}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-(--color-text-muted)">E-mail</dt>
          <dd>
            <a href={`mailto:${lead.email}`} className="text-(--color-primary) underline">
              {lead.email}
            </a>
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <h2 className="text-sm font-medium text-(--color-text-muted)">Objet</h2>
        <p className="mt-1 font-semibold">{lead.subject}</p>
      </div>

      <div className="mt-4">
        <h2 className="text-sm font-medium text-(--color-text-muted)">Message</h2>
        <p className="mt-1 whitespace-pre-wrap">{lead.message}</p>
      </div>

      {lead.droppedAttachmentCount > 0 && (
        <p className="mt-6 rounded-(--radius-md) border-2 border-(--color-warning) bg-(--color-surface) p-4">
          <strong>Attention :</strong>{" "}
          {lead.droppedAttachmentCount === 1
            ? "1 fichier envoyé par le visiteur n'a pas été enregistré. Demandez-le lors de la prise de contact."
            : `${lead.droppedAttachmentCount} fichiers envoyés par le visiteur n'ont pas été enregistrés. Demandez-les lors de la prise de contact.`}
        </p>
      )}

      {lead.attachments.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-(--color-text-muted)">Pièces jointes</h2>
          <div className="mt-2">
            <AttachmentGallery attachments={lead.attachments} />
          </div>
        </div>
      )}
    </section>
  );
}
