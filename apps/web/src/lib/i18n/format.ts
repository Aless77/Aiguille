import { formatDate, formatPrice } from "@/lib/catalog/format";

import { type Locale, LOCALE_TAGS } from "./config";

export interface Plural {
  one: string;
  other: string;
}

/**
 * Formats d'une langue : prix, dates, nombres, millimètres et pluriels. Mêmes fonctions côté
 * serveur (getDictionary) et navigateur (useLocale).
 */
export function formatters(locale: Locale) {
  const tag = LOCALE_TAGS[locale];
  const rules = new Intl.PluralRules(tag);
  const regions = new Intl.DisplayNames([tag], { type: "region" });
  const number = (n: number, digits = 1) =>
    n.toLocaleString(tag, { maximumFractionDigits: digits }).replace(/ /g, " ");
  return {
    tag,
    price: (cents: number | null | undefined) => formatPrice(cents, tag),
    date: (date: Date | string) => formatDate(date, tag),
    month: (date: Date) =>
      new Intl.DateTimeFormat(tag, {
        month: "long",
        year: "numeric",
        timeZone: "Europe/Paris",
      }).format(date),
    number,
    mm: (n: number) => `${number(n)} mm`,
    /** Nom du pays dans la langue (code ISO 3166-1 alpha-2). */
    country: (code: string) => regions.of(code) ?? code,
    /** « 1 montre », « 3 montres » : forme choisie par les règles de la langue. */
    plural: (forms: Plural, n: number, vars: Record<string, string | number> = {}) =>
      (rules.select(n) === "one" ? forms.one : forms.other).replace(/\{(\w+)\}/g, (m, k: string) =>
        k === "count" ? number(n, 0) : k in vars ? String(vars[k]) : m,
      ),
  };
}

export type Formatters = ReturnType<typeof formatters>;
