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

/** Nom affiché avec la marque, sans la répéter : « Tissot PRX 40mm », « Hamilton Khaki Field Mechanical ». */
export function displayName(brandName: string, name: string): string {
  return name.toLowerCase().startsWith(brandName.toLowerCase()) ? name : `${brandName} ${name}`;
}

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

/** Modèles du résumé dans une langue (lib/i18n/dictionaries, clé watch.summary). */
export interface SummaryTexts {
  /** « La {name} (référence {reference}) est {kind}{diameter} ». */
  intro: string;
  kinds: Record<Movement, string> & { none: string };
  diameter: string;
  caliber: string;
  water: string;
  reserve: string;
  price: string;
}

export const FRENCH_SUMMARY: SummaryTexts = {
  intro: "La {name} (référence {reference}) est {kind}{diameter}",
  kinds: {
    automatique: "une montre automatique",
    manuel: "une montre à remontage manuel",
    quartz: "une montre à quartz",
    solaire: "une montre solaire",
    autre: "une montre",
    none: "une montre",
  },
  diameter: " de {mm}",
  caliber: "équipée du calibre {caliber}",
  water: "étanche à {m} m",
  reserve: "avec {h} heures de réserve de marche",
  price: " Prix catalogue officiel relevé : {price}.",
};

const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

/**
 * Résumé factuel rédigé à partir de nos données. On n'affiche pas le texte marketing des
 * marques : contenu protégé et dupliqué sur des centaines de sites (mauvais pour le SEO).
 */
export function watchSummary(
  w: SummaryInput,
  texts: SummaryTexts = FRENCH_SUMMARY,
  locale = "fr-FR",
): string {
  const mm = (n: number) => `${n.toLocaleString(locale, { maximumFractionDigits: 1 })} mm`;
  const facts = [
    fill(texts.intro, {
      name: displayName(w.brandName, w.name),
      reference: w.reference,
      kind: texts.kinds[w.movement ?? "none"],
      diameter: w.diameterMm ? fill(texts.diameter, { mm: mm(w.diameterMm) }) : "",
    }),
  ];
  if (w.caliber) facts.push(fill(texts.caliber, { caliber: w.caliber }));
  if (w.waterResistanceM) facts.push(fill(texts.water, { m: w.waterResistanceM }));
  if (w.powerReserveH) facts.push(fill(texts.reserve, { h: w.powerReserveH }));

  let text = facts.join(", ") + ".";
  const price = formatPrice(w.catalogPriceCents, locale);
  if (price) text += fill(texts.price, { price });
  return text;
}

/** Coupe un texte à `max` caractères sur une limite de mot (meta description). */
export function truncate(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
