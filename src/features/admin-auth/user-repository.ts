import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

/*
 * Interface minimale (ISP) : le service d'authentification ne dépend que de ces opérations,
 * ce qui permet de le tester avec un faux dépôt (DIP).
 */
export interface AdminUserRepository {
  findByEmail(email: string): Promise<User | undefined>;
  findById(id: number): Promise<User | undefined>;
  updateLockout(id: number, state: { failedLoginCount: number; lockedUntil: Date | null }): Promise<void>;
  updatePasswordHash(id: number, passwordHash: string): Promise<void>;
  setPendingTotpSecret(id: number, secret: string): Promise<void>;
  enableTotp(id: number): Promise<void>;
  disableTotp(id: number): Promise<void>;
}

export const drizzleAdminUserRepository: AdminUserRepository = {
  async findByEmail(email) {
    const [row] = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
    return row;
  },

  async findById(id) {
    const [row] = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
    return row;
  },

  async updateLockout(id, state) {
    await getDb()
      .update(users)
      .set({ failedLoginCount: state.failedLoginCount, lockedUntil: state.lockedUntil })
      .where(eq(users.id, id));
  },

  async updatePasswordHash(id, passwordHash) {
    await getDb().update(users).set({ passwordHash }).where(eq(users.id, id));
  },

  // Le secret est stocké dès le début de l'inscription, mais totpEnabledAt reste vide
  // jusqu'à la confirmation (enableTotp) : un secret non confirmé n'active jamais le 2FA.
  async setPendingTotpSecret(id, secret) {
    await getDb().update(users).set({ totpSecret: secret, totpEnabledAt: null }).where(eq(users.id, id));
  },

  async enableTotp(id) {
    await getDb().update(users).set({ totpEnabledAt: new Date() }).where(eq(users.id, id));
  },

  async disableTotp(id) {
    await getDb().update(users).set({ totpSecret: null, totpEnabledAt: null }).where(eq(users.id, id));
  },
};
