import "server-only";

import { desc, eq } from "drizzle-orm";

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
  create(input: NewLeadInput, attachments: AttachmentToStore[]): Promise<number>;
  list(): Promise<Lead[]>;
  findById(id: number): Promise<LeadWithAttachments | undefined>;
  findAttachmentById(id: number): Promise<LeadAttachment | undefined>;
  markRead(id: number): Promise<void>;
}

export const drizzleLeadRepository: LeadRepository = {
  async create(input, attachments) {
    const db = getDb();
    // Transaction : si l'insertion des pièces jointes échoue, la demande elle-même n'est pas créée à moitié.
    const id = db.transaction((tx) => {
      const result = tx.insert(leads).values(input).run();
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

  async list() {
    return getDb().select().from(leads).orderBy(desc(leads.createdAt));
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
};
