import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { recoveryCodes, type RecoveryCode } from "@/lib/db/schema";

export interface RecoveryCodeRepository {
  replaceAll(userId: number, codeHashes: string[]): Promise<void>;
  findUnused(userId: number): Promise<RecoveryCode[]>;
  markUsed(id: number): Promise<void>;
  deleteAll(userId: number): Promise<void>;
}

export const drizzleRecoveryCodeRepository: RecoveryCodeRepository = {
  // Remplace l'intégralité des codes : une nouvelle inscription au 2FA invalide les anciens.
  async replaceAll(userId, codeHashes) {
    const db = getDb();
    db.delete(recoveryCodes).where(eq(recoveryCodes.userId, userId)).run();
    if (codeHashes.length === 0) return;
    db.insert(recoveryCodes)
      .values(codeHashes.map((codeHash) => ({ userId, codeHash })))
      .run();
  },

  async findUnused(userId) {
    return getDb()
      .select()
      .from(recoveryCodes)
      .where(and(eq(recoveryCodes.userId, userId), isNull(recoveryCodes.usedAt)));
  },

  async markUsed(id) {
    await getDb().update(recoveryCodes).set({ usedAt: new Date() }).where(eq(recoveryCodes.id, id));
  },

  async deleteAll(userId) {
    await getDb().delete(recoveryCodes).where(eq(recoveryCodes.userId, userId));
  },
};
