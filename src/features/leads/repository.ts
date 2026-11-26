import "server-only";

import { count, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { leadAttachments, leads, type Lead, type LeadAttachment } from "@/lib/db/schema";
import type { AttachmentToStore } from "@/lib/uploads";

export type NewLeadInput = {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
};

export type LeadWithAttachments = Lead & { attachments: LeadAttachment[] };

/*
 * Interface ciblée (ISP) : le formulaire public n'a besoin que de `create`, l'admin que du reste.
 * Les deux passent par cette même interface (DIP), jamais par Drizzle directement.
 */
export interface LeadRepository {
  // droppedAttachmentCount : fichiers envoyés par le visiteur mais non enregistrés.
  create(input: NewLeadInput, attachments: AttachmentToStore[], droppedAttachmentCount?: number): Promise<number>;
  // Pagination simple : page (à partir de 1) de `pageSize` demandes, les plus récentes d'abord.
  listPage(page: number, pageSize: number): Promise<{ leads: Lead[]; total: number }>;
  counts(): Promise<{ total: number; unread: number }>;
  findById(id: number): Promise<LeadWithAttachments | undefined>;
  findAttachmentById(id: number): Promise<LeadAttachment | undefined>;
  markRead(id: number): Promise<void>;
  // done = traitée ; false rouvre la demande (retour à « lue »).
  setDone(id: number, done: boolean): Promise<void>;
}

export const drizzleLeadRepository: LeadRepository = {
  async create(input, attachments, droppedAttachmentCount = 0) {
    const db = getDb();
    // Transaction : si l'insertion des pièces jointes échoue, la demande elle-même n'est pas créée à moitié.
    const id = db.transaction((tx) => {
      const result = tx
        .insert(leads)
        .values({ ...input, droppedAttachmentCount })
        .run();
      const leadId = Number(result.lastInsertRowid);
      if (attachments.length > 0) {
        tx.insert(leadAttachments)
          .values(attachments.map((a) => ({ ...a, leadId })))
          .run();
      }
      return leadId;
    });
    return id;
  },

  async listPage(page, pageSize) {
    const db = getDb();
    const rows = await db
      .select()
      .from(leads)
      .orderBy(desc(leads.createdAt), desc(leads.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    const [{ total = 0 } = {}] = await db.select({ total: count() }).from(leads);
    return { leads: rows, total };
  },

  async counts() {
    const db = getDb();
    const [{ total = 0 } = {}] = await db.select({ total: count() }).from(leads);
    const [{ unread = 0 } = {}] = await db.select({ unread: count() }).from(leads).where(eq(leads.status, "new"));
    return { total, unread };
  },

  async findById(id) {
    const [lead] = await getDb().select().from(leads).where(eq(leads.id, id)).limit(1);
    if (!lead) return undefined;
    const attachments = await getDb().select().from(leadAttachments).where(eq(leadAttachments.leadId, id));
    return { ...lead, attachments };
  },

  async findAttachmentById(id) {
    const [attachment] = await getDb().select().from(leadAttachments).where(eq(leadAttachments.id, id)).limit(1);
    return attachment;
  },

  async markRead(id) {
    await getDb().update(leads).set({ status: "read" }).where(eq(leads.id, id));
  },

  async setDone(id, done) {
    await getDb()
      .update(leads)
      .set({ status: done ? "done" : "read" })
      .where(eq(leads.id, id));
  },
};
