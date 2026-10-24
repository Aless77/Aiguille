import { closeDb, getDb } from "./client.ts";
import { refreshScores } from "./scores.ts";

/** Recalcul manuel des notes : npm run db:scores (le scraper le fait après chaque collecte). */
const count = await refreshScores(getDb());
console.log(`${count} notes recalculées`);
await closeDb();
