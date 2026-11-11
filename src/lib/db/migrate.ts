/*
 * Applique les migrations versionnées (src/lib/db/migrations).
 * Lancé via `npm run db:migrate`, qui active la condition "react-server" pour que server-only ne bloque pas le script.
 */
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";

import { getDb } from "./index";

const db = getDb();
migrate(db, { migrationsFolder: path.resolve(process.cwd(), "src/lib/db/migrations") });
console.log("Migrations appliquées.");
