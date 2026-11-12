import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { emailCodes, type EmailCode } from "@/lib/db/schema";

export type EmailCodePurpose = EmailCode["purpose"];

export type NewEmailCode = {
  userId: number;
  purpose: EmailCodePurpose;
  codeHash: string;
  expiresAt: Date;
  createdAt: Date;
};

export interface EmailCodeRepository {
  replace(code: NewEmailCode): Promise<void>;
  findLatest(userId: number, purpose: EmailCodePurpose): Promise<EmailCode | undefined>;
  incrementAttempts(id: number): Promise<void>;
  markUsed(id: number, at: Date): Promise<void>;
}

export const drizzleEmailCodeRepository: EmailCodeRepository = {
  // Un seul code actif par (utilisateur, usage) : en émettre un nouveau invalide l'ancien.
  async replace(code) {
    const db = getDb();
    db.delete(emailCodes)
      .where(and(eq(emailCodes.userId, code.userId), eq(emailCodes.purpose, code.purpose)))
      .run();
    db.insert(emailCodes).values(code).run();
  },

  async findLatest(userId, purpose) {
    const [row] = await getDb()
      .select()
      .from(emailCodes)
      .where(and(eq(emailCodes.userId, userId), eq(emailCodes.purpose, purpose)))
      .orderBy(desc(emailCodes.id))
      .limit(1);
    return row;
  },

  async incrementAttempts(id) {
    const db = getDb();
    const [row] = await db.select().from(emailCodes).where(eq(emailCodes.id, id)).limit(1);
    if (!row) return;
    await db
      .update(emailCodes)
      .set({ attempts: row.attempts + 1 })
      .where(eq(emailCodes.id, id));
  },

  async markUsed(id, at) {
    await getDb().update(emailCodes).set({ usedAt: at }).where(eq(emailCodes.id, id));
  },
};
