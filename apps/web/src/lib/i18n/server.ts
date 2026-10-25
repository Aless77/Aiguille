import { lang } from "next/root-params";

import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { resolveDictionary, type ResolvedDictionary } from "./dictionary";

/**
 * Langue de la page en cours (segment racine app/[lang]), lisible depuis n'importe quel
 * composant serveur, y compris dans une fonction "use cache" (la langue entre dans la clé).
 */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<ResolvedDictionary & { locale: Locale }> {
  const locale = await getLocale();
  return { locale, ...resolveDictionary(locale) };
}
