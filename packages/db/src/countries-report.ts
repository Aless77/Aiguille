import { sql } from "drizzle-orm";

import { closeDb, getDb } from "./client.ts";
import { UNDISCLOSED_COUNTRY } from "./countries.ts";
import { users } from "./schema.ts";

/**
 * Provenance des comptes par pays (npm run db:pays) : seul le pays déclaré est compté, aucune
 * donnée individuelle n'est affichée.
 */
const rows = await getDb()
  .select({ country: users.country, n: sql<number>`count(*)::int` })
  .from(users)
  .groupBy(users.country)
  .orderBy(sql`count(*) desc`);

const names = new Intl.DisplayNames(["fr"], { type: "region" });
const total = rows.reduce((sum, r) => sum + r.n, 0);
console.log(`Comptes : ${total}\n`);
for (const { country, n } of rows) {
  const label =
    country === null
      ? "Pas encore renseigné"
      : country === UNDISCLOSED_COUNTRY
        ? "Préfère ne pas le dire"
        : `${names.of(country) ?? country} (${country})`;
  console.log(`${String(n).padStart(6)}  ${label}`);
}
await closeDb();
