import { type Database, exchangeRates } from "@aiguille/db";
import { z } from "zod";

import { USER_AGENT } from "../config.ts";
import { FOREIGN_CURRENCIES } from "./countries.ts";

/** API publique des taux de référence de la BCE (cahier des charges : « BCE via Frankfurter »). */
const API = "https://api.frankfurter.dev/v1/latest";

const responseSchema = z.object({
  base: z.literal("EUR"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rates: z.record(z.string(), z.number().positive()),
});

/** Taux du jour (unités de devise pour 1 €), validés. Publiés par la BCE les jours ouvrés. */
export async function fetchRates(): Promise<z.infer<typeof responseSchema>> {
  const url = `${API}?base=EUR&symbols=${FOREIGN_CURRENCIES.join(",")}`;
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Taux de change : HTTP ${response.status}`);
  const data = responseSchema.parse(await response.json());
  const missing = FOREIGN_CURRENCIES.filter((c) => !(c in data.rates));
  if (missing.length) throw new Error(`Taux de change manquants : ${missing.join(", ")}`);
  return data;
}

/** Enregistre les taux du jour (sans doublon : la BCE ne publie pas le week-end). */
export async function saveRates(db: Database): Promise<{ date: string; count: number }> {
  const { date, rates } = await fetchRates();
  await db
    .insert(exchangeRates)
    .values(
      Object.entries(rates).map(([currency, unitsPerEur]) => ({ date, currency, unitsPerEur })),
    )
    .onConflictDoNothing();
  return { date, count: Object.keys(rates).length };
}
