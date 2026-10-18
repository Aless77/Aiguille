import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.ts";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

let cached: { db: Database; sql: postgres.Sql } | undefined;

/**
 * Connexion paresseuse : rien n'est ouvert tant qu'on n'appelle pas getDb().
 * Le build Next.js peut ainsi tourner sans base disponible.
 */
export function getDb(): Database {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL manquante : copiez .env.example vers .env");
    }
    const sql = postgres(url, { max: 5 });
    cached = { db: drizzle(sql, { schema }), sql };
  }
  return cached.db;
}

/** Ferme la connexion (utile pour les scripts qui doivent se terminer). */
export async function closeDb(): Promise<void> {
  if (cached) {
    await cached.sql.end();
    cached = undefined;
  }
}
