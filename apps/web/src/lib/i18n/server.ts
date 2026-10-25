import { lang } from "next/root-params";

import { DEFAULT_LOCALE, isLocale, type Locale, localizePath } from "./config";
import { resolveDictionary, type ResolvedDictionary } from "./dictionary";
import { formatters, type Formatters } from "./format";

/**
 * Langue de la page en cours (segment racine app/[lang]), lisible depuis n'importe quel
 * composant serveur, y compris dans une fonction "use cache" (la langue entre dans la clé).
 */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<
  ResolvedDictionary & {
    locale: Locale;
    f: Formatters;
    /** Chemin interne dans la langue de la page (liens, JSON-LD). */
    path: (path: string) => string;
  }
> {
  const locale = await getLocale();
  return {
    locale,
    f: formatters(locale),
    path: (p) => localizePath(locale, p),
    ...resolveDictionary(locale),
  };
}
