import { type Movement } from "./types";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Centimes → « 1 250 € ». Les centimes sont arrondis : les prix catalogue sont ronds. */
export function formatPrice(cents: number | null | undefined, locale = "fr-FR"): string | null {
  if (cents === null || cents === undefined) return null;
  const formatter =
    locale === "fr-FR"
      ? priceFormatter
      : new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 0,
        });
  return formatter.format(Math.round(cents / 100)).replace(/ /g, " ");
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});

export function formatDate(date: Date | string, locale = "fr-FR"): string {
  const formatter =
    locale === "fr-FR"
      ? dateFormatter
      : new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Paris" });
  return formatter.format(typeof date === "string" ? new Date(date) : date);
}

export const MOVEMENT_LABELS: Record<Movement, string> = {
  automatique: "Automatique",
  manuel: "Remontage manuel",
  quartz: "Quartz",
  solaire: "Solaire",
  autre: "Autre",
};

/** Adjectif pour une phrase : « une montre automatique », « une montre à quartz ». */
const MOVEMENT_PHRASES: Record<Movement, string> = {
  automatique: "automatique",
  manuel: "à remontage manuel",
  quartz: "à quartz",
  solaire: "solaire",
  autre: "",
};

/** Nom affiché avec la marque, sans la répéter : « Tissot PRX 40mm », « Hamilton Khaki Field Mechanical ». */
export function displayName(brandName: string, name: string): string {
  return name.toLowerCase().startsWith(brandName.toLowerCase()) ? name : `${brandName} ${name}`;
}

const formatMm = (mm: number) => `${String(mm).replace(".", ",")} mm`;

export interface SummaryInput {
  brandName: string;
  name: string;
  reference: string;
  movement: Movement | null;
  caliber: string | null;
  diameterMm: number | null;
  waterResistanceM: number | null;
  powerReserveH: number | null;
  catalogPriceCents: number | null;
}

/**
 * Résumé factuel rédigé à partir de nos données. On n'affiche pas le texte marketing des
 * marques : contenu protégé et dupliqué sur des centaines de sites (mauvais pour le SEO).
 */
export function watchSummary(w: SummaryInput): string {
  const facts: string[] = [];
  const kind = w.movement ? MOVEMENT_PHRASES[w.movement] : "";
  let first = `La ${displayName(w.brandName, w.name)} (référence ${w.reference}) est une montre${kind ? ` ${kind}` : ""}`;
  if (w.diameterMm) first += ` de ${formatMm(w.diameterMm)}`;
  facts.push(first);
  if (w.caliber) facts.push(`équipée du calibre ${w.caliber}`);
  if (w.waterResistanceM) facts.push(`étanche à ${w.waterResistanceM} m`);
  if (w.powerReserveH) facts.push(`avec ${w.powerReserveH} heures de réserve de marche`);

  let text = facts.join(", ") + ".";
  const price = formatPrice(w.catalogPriceCents);
  if (price) text += ` Prix catalogue officiel relevé : ${price}.`;
  return text;
}

/** Coupe un texte à `max` caractères sur une limite de mot (meta description). */
export function truncate(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
