import { type Availability } from "./price-history";

/**
 * Pays couverts (lot 4) : nom affiché, tournure « en / au / aux » et identifiant ISO 3166
 * numérique (fond de carte).
 */
export const COUNTRY_INFO: Record<string, { name: string; inName: string; isoNumeric: string }> = {
  FR: { name: "France", inName: "en France", isoNumeric: "250" },
  DE: { name: "Allemagne", inName: "en Allemagne", isoNumeric: "276" },
  IT: { name: "Italie", inName: "en Italie", isoNumeric: "380" },
  ES: { name: "Espagne", inName: "en Espagne", isoNumeric: "724" },
  NL: { name: "Pays-Bas", inName: "aux Pays-Bas", isoNumeric: "528" },
  BE: { name: "Belgique", inName: "en Belgique", isoNumeric: "056" },
  AT: { name: "Autriche", inName: "en Autriche", isoNumeric: "040" },
  PT: { name: "Portugal", inName: "au Portugal", isoNumeric: "620" },
  IE: { name: "Irlande", inName: "en Irlande", isoNumeric: "372" },
  CH: { name: "Suisse", inName: "en Suisse", isoNumeric: "756" },
  GB: { name: "Royaume-Uni", inName: "au Royaume-Uni", isoNumeric: "826" },
  SE: { name: "Suède", inName: "en Suède", isoNumeric: "752" },
  DK: { name: "Danemark", inName: "au Danemark", isoNumeric: "208" },
  PL: { name: "Pologne", inName: "en Pologne", isoNumeric: "616" },
};

export interface CountryPriceRow {
  country: string;
  priceCents: number | null;
  currency: string;
  availability: Availability;
  observedAt: Date | string;
  url?: string | null;
}

export interface EuropePrice {
  country: string;
  name: string;
  isoNumeric: string;
  /** Prix en devise locale (centimes). */
  localCents: number;
  currency: string;
  /** Prix converti en euros au dernier taux BCE (centimes). */
  eurCents: number;
  /** Écart avec le prix français, en % (null sans prix français). */
  deltaPercent: number | null;
  availability: Availability;
  date: string;
  url: string | null;
}

/**
 * Prix nationaux convertis en euros et comparés à la France, du moins cher au plus cher. Un pays
 * sans taux de change connu pour sa devise est écarté plutôt que mal converti.
 */
export function buildEuropePrices(
  rows: CountryPriceRow[],
  unitsPerEur: Record<string, number>,
): EuropePrice[] {
  const converted = rows
    .filter((r): r is CountryPriceRow & { priceCents: number } => r.priceCents !== null)
    .filter((r) => COUNTRY_INFO[r.country] && (r.currency === "EUR" || unitsPerEur[r.currency]))
    .map((r) => ({
      ...r,
      eurCents: Math.round(
        r.currency === "EUR" ? r.priceCents : r.priceCents / unitsPerEur[r.currency]!,
      ),
    }));
  const france = converted.find((r) => r.country === "FR")?.eurCents;

  return converted
    .map((r) => ({
      country: r.country,
      name: COUNTRY_INFO[r.country]!.name,
      isoNumeric: COUNTRY_INFO[r.country]!.isoNumeric,
      localCents: r.priceCents,
      currency: r.currency,
      eurCents: r.eurCents,
      deltaPercent: france ? Math.round(((r.eurCents - france) / france) * 1000) / 10 : null,
      availability: r.availability,
      date: new Date(r.observedAt).toISOString().slice(0, 10),
      url: r.url ?? null,
    }))
    .sort((a, b) => a.eurCents - b.eurCents);
}

export interface EuropeSummaryTexts {
  /** La France est le pays le moins cher. */
  franceCheapest: string;
  /** « Moins chère {inCountry} : environ {percent} % de moins qu'en France… ». */
  cheaper: string;
  /** Pays précédé de sa préposition (« au Royaume-Uni ») ou simple nom selon la langue. */
  inCountry: (code: string) => string;
  number: (n: number) => string;
}

const FRENCH_SUMMARY: EuropeSummaryTexts = {
  franceCheapest: "La France fait partie des pays où cette montre est la moins chère.",
  cheaper: "Moins chère {inCountry} : environ {percent} % de moins qu'en France après conversion.",
  inCountry: (code) => COUNTRY_INFO[code]?.inName ?? code,
  number: (n) => n.toLocaleString("fr-FR"),
};

/** Phrase de synthèse pour le HTML serveur (SEO) : pays le moins cher comparé à la France. */
export function europeSummary(
  prices: EuropePrice[],
  texts: EuropeSummaryTexts = FRENCH_SUMMARY,
): string | null {
  const france = prices.find((p) => p.country === "FR");
  const cheapest = prices[0];
  if (!france || !cheapest || prices.length < 2) return null;
  if (cheapest.country === "FR") return texts.franceCheapest;
  return texts.cheaper
    .replace("{inCountry}", texts.inCountry(cheapest.country))
    .replace("{percent}", texts.number(Math.abs(cheapest.deltaPercent ?? 0)));
}
