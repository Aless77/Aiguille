import { COUNTRY_INFO } from "./europe-prices";
import { type Availability } from "./price-history";

export interface BrandCountryRow {
  brandSlug: string;
  brandName: string;
  watchId: number;
  country: string;
  priceCents: number | null;
  currency: string;
  availability: Availability;
}

export interface CountryIndex {
  country: string;
  name: string;
  inName: string;
  isoNumeric: string;
  /** Écart médian avec la France, en % (montres relevées dans les deux pays). */
  medianDeltaPercent: number;
  /** Nombre de montres comparées. */
  compared: number;
  /** Part des montres relevées « en stock » sur le site national, en %. */
  inStockPercent: number;
}

export interface BrandEuropeIndex {
  brandSlug: string;
  brandName: string;
  countries: CountryIndex[];
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

/**
 * Indice des prix par pays et par marque (cahier des charges, lot 4 : « prix moyen ou
 * disponibilité par pays ») : pour chaque pays, écart médian avec le prix français des mêmes
 * références, converti en euros. La médiane résiste aux quelques références à prix atypique.
 */
export function buildEuropeIndex(
  rows: BrandCountryRow[],
  unitsPerEur: Record<string, number>,
  minCompared = 3,
): BrandEuropeIndex[] {
  const toEur = (r: BrandCountryRow) =>
    r.priceCents === null
      ? null
      : r.currency === "EUR"
        ? r.priceCents
        : unitsPerEur[r.currency]
          ? r.priceCents / unitsPerEur[r.currency]!
          : null;

  const brands = new Map<string, { name: string; rows: BrandCountryRow[] }>();
  for (const r of rows) {
    const b = brands.get(r.brandSlug) ?? { name: r.brandName, rows: [] };
    b.rows.push(r);
    brands.set(r.brandSlug, b);
  }

  return [...brands.entries()]
    .map(([brandSlug, { name, rows: brandRows }]) => {
      const france = new Map<number, number>();
      for (const r of brandRows) {
        const eur = r.country === "FR" ? toEur(r) : null;
        if (eur !== null) france.set(r.watchId, eur);
      }
      const byCountry = new Map<string, BrandCountryRow[]>();
      for (const r of brandRows) {
        if (r.country === "FR" || !COUNTRY_INFO[r.country]) continue;
        byCountry.set(r.country, [...(byCountry.get(r.country) ?? []), r]);
      }

      const countries = [...byCountry.entries()]
        .map(([country, list]) => {
          const deltas = list.flatMap((r) => {
            const eur = toEur(r);
            const fr = france.get(r.watchId);
            return eur !== null && fr ? [((eur - fr) / fr) * 100] : [];
          });
          return {
            country,
            name: COUNTRY_INFO[country]!.name,
            inName: COUNTRY_INFO[country]!.inName,
            isoNumeric: COUNTRY_INFO[country]!.isoNumeric,
            medianDeltaPercent: deltas.length ? Math.round(median(deltas) * 10) / 10 : 0,
            compared: deltas.length,
            inStockPercent: Math.round(
              (list.filter((r) => r.availability === "in_stock").length / list.length) * 100,
            ),
          };
        })
        .filter((c) => c.compared >= minCompared)
        .sort((a, b) => a.medianDeltaPercent - b.medianDeltaPercent);

      return { brandSlug, brandName: name, countries };
    })
    .filter((b) => b.countries.length > 0)
    .sort((a, b) => a.brandName.localeCompare(b.brandName, "fr"));
}
