export type Availability = "in_stock" | "out_of_stock" | "preorder" | "unknown";

export interface Observation {
  source: string;
  priceCents: number | null;
  availability: Availability;
  observedAt: Date | string;
  url?: string | null;
}

export interface PricePoint {
  /** Date ISO (AAAA-MM-JJ). */
  date: string;
  priceCents: number;
}

export interface PriceSeries {
  source: string;
  label: string;
  /** Paliers : un point à chaque changement, puis un point final à la date du dernier relevé. */
  points: PricePoint[];
}

export interface PriceExtreme {
  priceCents: number;
  date: string;
  source: string;
}

export interface PriceHistory {
  series: PriceSeries[];
  current: { priceCents: number | null; availability: Availability; date: string } | null;
  lowest: PriceExtreme | null;
  highest: PriceExtreme | null;
  since: string | null;
  changes: {
    date: string;
    source: string;
    label: string;
    priceCents: number | null;
    availability: Availability;
  }[];
}

const toDay = (d: Date | string) =>
  (typeof d === "string" ? new Date(d) : d).toISOString().slice(0, 10);

/**
 * Libellé lisible d'une source : « tissot-officiel » → « Site officiel Tissot ». Les revendeurs
 * (lot 3, suite) suivront le même format d'identifiant.
 */
export function sourceLabel(source: string, brandName: string): string {
  if (source.endsWith("-officiel")) return `Site officiel ${brandName}`;
  return RETAILER_LABELS[source] ?? source.charAt(0).toUpperCase() + source.slice(1);
}

const RETAILER_LABELS: Record<string, string> = { lepage: "Lepage", ocarat: "Ocarat" };

export interface CurrentOffer {
  source: string;
  label: string;
  official: boolean;
  priceCents: number;
  availability: Availability;
  date: string;
  url: string | null;
}

const AVAILABILITY_RANK: Record<Availability, number> = {
  in_stock: 0,
  preorder: 1,
  unknown: 2,
  out_of_stock: 3,
};

/**
 * Offre en cours de chaque vendeur (dernier relevé par source). Une offre retirée (dernier relevé
 * sans prix) n'est plus listée. Tri : disponibles d'abord, puis du moins cher au plus cher.
 */
export function currentOffers(observations: Observation[], brandName: string): CurrentOffer[] {
  const latest = new Map<string, Observation>();
  for (const o of observations) {
    const previous = latest.get(o.source);
    if (!previous || new Date(o.observedAt) >= new Date(previous.observedAt))
      latest.set(o.source, o);
  }
  return [...latest.values()]
    .filter((o): o is Observation & { priceCents: number } => o.priceCents !== null)
    .map((o) => ({
      source: o.source,
      label: sourceLabel(o.source, brandName),
      official: o.source.endsWith("-officiel"),
      priceCents: o.priceCents,
      availability: o.availability,
      date: toDay(o.observedAt),
      url: o.url ?? null,
    }))
    .sort(
      (a, b) =>
        AVAILABILITY_RANK[a.availability] - AVAILABILITY_RANK[b.availability] ||
        a.priceCents - b.priceCents,
    );
}

/**
 * Construit l'historique affiché sur une fiche à partir des relevés (un par changement de prix ou
 * de stock, voir le schéma). `seenAt` = date du dernier passage du scraper : le dernier prix est
 * prolongé jusqu'à cette date, sinon une montre au prix stable n'aurait qu'un seul point.
 */
export function buildPriceHistory(
  observations: Observation[],
  brandName: string,
  seenAt: Date | string,
  officialSource?: string,
): PriceHistory {
  const sorted = [...observations].sort(
    (a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime(),
  );
  const lastDay = toDay(seenAt);

  const bySource = new Map<string, Observation[]>();
  for (const o of sorted) bySource.set(o.source, [...(bySource.get(o.source) ?? []), o]);

  const series: PriceSeries[] = [...bySource.entries()].map(([source, list]) => {
    const points = list
      .filter((o): o is Observation & { priceCents: number } => o.priceCents !== null)
      .map((o) => ({ date: toDay(o.observedAt), priceCents: o.priceCents }));
    const last = points.at(-1);
    if (last && last.date < lastDay) points.push({ date: lastDay, priceCents: last.priceCents });
    return { source, label: sourceLabel(source, brandName), points };
  });

  let lowest: PriceExtreme | null = null;
  let highest: PriceExtreme | null = null;
  for (const o of sorted) {
    if (o.priceCents === null) continue;
    const day = toDay(o.observedAt);
    // À prix égal, on garde la première date : « plus bas depuis le … ».
    if (!lowest || o.priceCents < lowest.priceCents)
      lowest = { priceCents: o.priceCents, date: day, source: o.source };
    if (!highest || o.priceCents > highest.priceCents)
      highest = { priceCents: o.priceCents, date: day, source: o.source };
  }

  const reference =
    (officialSource ? bySource.get(officialSource) : undefined) ?? [...bySource.values()][0];
  const latest = reference?.at(-1);

  return {
    series,
    current: latest
      ? {
          priceCents: latest.priceCents,
          availability: latest.availability,
          date: toDay(latest.observedAt),
        }
      : null,
    lowest,
    highest,
    since: sorted[0] ? toDay(sorted[0].observedAt) : null,
    changes: sorted
      .map((o) => ({
        date: toDay(o.observedAt),
        source: o.source,
        label: sourceLabel(o.source, brandName),
        priceCents: o.priceCents,
        availability: o.availability,
      }))
      .reverse(),
  };
}

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  in_stock: "En stock",
  out_of_stock: "Rupture de stock",
  preorder: "En précommande",
  unknown: "Disponibilité inconnue",
};
