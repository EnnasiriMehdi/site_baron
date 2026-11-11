import "server-only";

import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { getEnv } from "@/lib/env";

import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema>;

let instance: Db | undefined;

/*
 * Connexion SQLite unique (singleton). Une seule instance de l'application doit écrire dans le fichier.
 * WAL : les lectures du site ne bloquent pas les écritures de l'admin.
 */
export function getDb(): Db {
  if (!instance) {
    // Dossier figé en dur (et non construit depuis l'env) pour que le bundler analyse ce chemin
    // statiquement, au lieu de tracer tout le projet comme dépendance du serveur.
    const dataDir = path.resolve(process.cwd(), "data");
    fs.mkdirSync(dataDir, { recursive: true });
    const file = path.join(dataDir, getEnv().DATABASE_FILENAME);

    const sqlite = new Database(file);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    sqlite.pragma("busy_timeout = 5000");

    instance = drizzle(sqlite, { schema });
  }
  return instance;
}
