/**
 * Pays européens couverts pour les prix (décision du 2026-10-19, docs/decisions.md) et devise
 * attendue de chacun : un prix dans une autre devise trahit une redirection vers un autre marché
 * (site « international ») et est rejeté.
 */
export const COUNTRIES = {
  FR: "EUR",
  DE: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  PT: "EUR",
  IE: "EUR",
  CH: "CHF",
  GB: "GBP",
  SE: "SEK",
  DK: "DKK",
  PL: "PLN",
} as const;

export type Country = keyof typeof COUNTRIES;

export const FOREIGN_CURRENCIES = [...new Set(Object.values(COUNTRIES))].filter((c) => c !== "EUR");

export function isCountry(value: string): value is Country {
  return value in COUNTRIES;
}

/**
 * Pays à relever un jour donné, hors France (relevée chaque jour) : rotation déterministe pour que
 * chaque pays soit revu tous les `ceil(n / perDay)` jours (une semaine avec 13 pays et 2 par jour).
 */
export function countriesForDay(available: Country[], date: Date, perDay = 2): Country[] {
  const foreign = available.filter((c) => c !== "FR");
  if (foreign.length === 0) return [];
  const day = Math.floor(date.getTime() / 86_400_000);
  const start = (day * perDay) % foreign.length;
  return Array.from({ length: Math.min(perDay, foreign.length) }, (_, i) => {
    return foreign[(start + i) % foreign.length]!;
  });
}
