import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";

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
  revokeSessions(id: number, currentVersion: number): Promise<void>;
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

  // Changer le mot de passe invalide toutes les sessions existantes (incrément fait ici, pas dans
  // l'action : impossible à oublier). L'appelant rouvre une session s'il doit rester connecté.
  async updatePasswordHash(id, passwordHash) {
    await getDb()
      .update(users)
      .set({ passwordHash, sessionVersion: sql`${users.sessionVersion} + 1` })
      .where(eq(users.id, id));
  },

  // Le secret est stocké dès le début de l'inscription, mais totpEnabledAt reste vide
  // jusqu'à la confirmation (enableTotp) : un secret non confirmé n'active jamais le 2FA.
  // La condition isNull(totpEnabledAt) est une défense en profondeur : même si une action oubliait
  // de vérifier, un secret ne peut jamais écraser celui d'une 2FA déjà active.
  async setPendingTotpSecret(id, secret) {
    await getDb()
      .update(users)
      .set({ totpSecret: secret })
      .where(and(eq(users.id, id), isNull(users.totpEnabledAt)));
  },

  // Activer ou désactiver la 2FA change la confiance accordée aux sessions existantes : on les révoque.
  async enableTotp(id) {
    await getDb()
      .update(users)
      .set({ totpEnabledAt: new Date(), sessionVersion: sql`${users.sessionVersion} + 1` })
      .where(eq(users.id, id));
  },

  async disableTotp(id) {
    await getDb()
      .update(users)
      .set({ totpSecret: null, totpEnabledAt: null, sessionVersion: sql`${users.sessionVersion} + 1` })
      .where(eq(users.id, id));
  },

  // Conditionnel à la version du jeton présenté : un cookie déjà révoqué ne peut pas redéclencher
  // une déconnexion générale de l'admin légitime.
  async revokeSessions(id, currentVersion) {
    await getDb()
      .update(users)
      .set({ sessionVersion: sql`${users.sessionVersion} + 1` })
      .where(and(eq(users.id, id), eq(users.sessionVersion, currentVersion)));
  },
};

/*
 * Destinataires des notifications adressées à l'administration (ex. nouvelle demande). Lus en base à chaque
 * envoi, jamais copiés dans le .env : si l'admin change d'adresse, la notification suit (CLAUDE.md, section 9 :
 * l'adresse n'est jamais fournie par un visiteur). Interface séparée (ISP) pour ne pas alourdir AdminUserRepository.
 */
export interface AdminRecipientsReader {
  listAdminEmails(): Promise<string[]>;
}

export const drizzleAdminRecipients: AdminRecipientsReader = {
  async listAdminEmails() {
    const rows = await getDb().select({ email: users.email }).from(users).where(eq(users.role, "admin"));
    return rows.map((row) => row.email);
  },
};
