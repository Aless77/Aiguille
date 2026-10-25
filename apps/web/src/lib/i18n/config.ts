/**
 * Langues du site (docs/decisions.md, 25 octobre 2026). Le français reste à la racine (URL déjà
 * indexées, slugs immuables) ; les autres langues ont un préfixe et les mêmes chemins :
 * /en/montres/tissot/prx/…, /de/montres/…
 *
 * Ajouter une langue : l'ajouter ici, créer son dictionnaire (lib/i18n/dictionaries), puis
 * l'activer avec la variable LANGUAGES.
 */
export const LOCALES = ["fr", "en", "de", "it", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";
/** Langue de repli quand un texte ou un contenu de marque n'existe pas dans la langue demandée. */
export const FALLBACK_LOCALE: Locale = "en";

/** Nom de chaque langue dans cette langue (sélecteur de langue). */
export const LOCALE_NAMES: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
  it: "Italiano",
  es: "Español",
};

/** Balise BCP 47 pour Intl (dates, prix, nombres) et hreflang. */
export const LOCALE_TAGS: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  de: "de-DE",
  it: "it-IT",
  es: "es-ES",
};

/** Langues indexables : les autres restent en noindex tant que leur traduction n'est pas complète. */
export const INDEXABLE_LOCALES: readonly Locale[] = ["fr"];

type Env = Record<string, string | undefined>;

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

/**
 * Langues publiées : LANGUAGES=« fr,en,de » (le français l'est toujours). Sans la variable, le
 * site reste en français seul : les URL préfixées répondent 404.
 */
export function enabledLocales(env: Env = process.env): Locale[] {
  const wanted = (env.LANGUAGES ?? "").split(",").map((l) => l.trim().toLowerCase());
  return LOCALES.filter((l) => l === DEFAULT_LOCALE || wanted.includes(l));
}

/** Chemin dans une langue : « /montres » → « /en/montres » (inchangé en français). */
export function localizePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE || !path.startsWith("/") || path.startsWith("//")) return path;
  if (isLocale(path.split(/[/?#]/)[1])) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** Langue et chemin sans préfixe d'une URL : « /en/montres » → { locale: "en", path: "/montres" }. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const first = pathname.split("/")[1];
  if (isLocale(first) && first !== DEFAULT_LOCALE) {
    return { locale: first, path: pathname.slice(first.length + 1) || "/" };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}
