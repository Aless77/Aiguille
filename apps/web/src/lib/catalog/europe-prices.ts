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
  /** Écart non arrondi avec le prix français, en % (null sans prix français). */
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
    .filter((r) => Number.isFinite(r.priceCents) && r.priceCents > 0)
    .filter(
      (r) =>
        COUNTRY_INFO[r.country] &&
        (r.currency === "EUR" ||
          (Number.isFinite(unitsPerEur[r.currency]) && unitsPerEur[r.currency]! > 0)),
    )
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
      deltaPercent: france ? ((r.eurCents - france) / france) * 100 : null,
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
  /** Prix légèrement inférieur, écart inférieur à la précision d'un dixième de pour cent. */
  similar: string;
  /** Pays précédé de sa préposition (« au Royaume-Uni ») ou simple nom selon la langue. */
  inCountry: (code: string) => string;
  number: (n: number) => string;
}

const FRENCH_SUMMARY: EuropeSummaryTexts = {
  franceCheapest: "La France fait partie des pays où cette montre est la moins chère.",
  cheaper: "Moins chère {inCountry} : environ {percent} % de moins qu'en France après conversion.",
  similar:
    "Prix très proche {inCountry} : moins de {percent} % d’écart avec la France après conversion.",
  inCountry: (code) => COUNTRY_INFO[code]?.inName ?? code,
  number: (n) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 }),
};

/** Même précision dans le tableau et les bulles de carte, sans produire « -0 % ». */
export function formatEuropeDelta(
  delta: number | null,
  number: (n: number) => string = FRENCH_SUMMARY.number,
) {
  if (delta === null) return "—";
  if (delta === 0) return `${number(0)} %`;
  if (Math.abs(delta) < 0.05) return `≈ ${number(0)} %`;
  return `${delta > 0 ? "+" : ""}${number(delta)} %`;
}

/** Phrase de synthèse pour le HTML serveur (SEO) : pays le moins cher comparé à la France. */
export function europeSummary(
  prices: EuropePrice[],
  texts: EuropeSummaryTexts = FRENCH_SUMMARY,
): string | null {
  const france = prices.find((p) => p.country === "FR");
  const cheapest = prices[0];
  if (!france || !cheapest || prices.length < 2) return null;
  // Les ex æquo restent vrais quel que soit l'ordre des pays dans les données.
  if (cheapest.eurCents >= france.eurCents) return texts.franceCheapest;
  const difference = ((france.eurCents - cheapest.eurCents) / france.eurCents) * 100;
  const similar = difference < 0.1;
  return (similar ? texts.similar : texts.cheaper)
    .replace("{inCountry}", texts.inCountry(cheapest.country))
    .replace("{percent}", texts.number(similar ? 0.1 : difference));
}
