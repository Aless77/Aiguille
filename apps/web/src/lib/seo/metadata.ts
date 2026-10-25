import { type Metadata } from "next";

import { truncate } from "@/lib/catalog/format";
import { DEFAULT_LOCALE, type Locale, LOCALE_TAGS, localizePath } from "@/lib/i18n/config";

interface PageMetadataInput {
  title: string;
  description: string;
  /** Chemin canonique, sans paramètres ni langue (« /montres/tissot »). */
  path: string;
  /** false : page utile aux visiteurs mais sans valeur de recherche (contenu trop pauvre…). */
  index?: boolean;
  images?: string[];
  /** Langue de la page : canonique dans cette langue. */
  locale?: Locale;
  /** Langues publiées et indexables : liens hreflang entre leurs versions. */
  alternateLocales?: readonly Locale[];
}

/**
 * Métadonnées d'une page publique, conformes à docs/seo/checklist.md : titre unique, description
 * ≤ 155 caractères, canonique sans paramètres, Open Graph, hreflang entre les langues indexables.
 * L'indexation reste de toute façon bloquée hors production par le layout racine.
 */
export function pageMetadata({
  title,
  description,
  path,
  index = true,
  images,
  locale = DEFAULT_LOCALE,
  alternateLocales = [],
}: PageMetadataInput): Metadata {
  const desc = truncate(description);
  const canonical = localizePath(locale, path);
  const languages =
    alternateLocales.length > 1
      ? {
          ...Object.fromEntries(
            alternateLocales.map((l) => [LOCALE_TAGS[l], localizePath(l, path)]),
          ),
          "x-default": path,
        }
      : undefined;
  return {
    title,
    description: desc,
    alternates: { canonical, ...(languages ? { languages } : {}) },
    openGraph: {
      title,
      description: desc,
      url: canonical,
      locale: LOCALE_TAGS[locale].replace("-", "_"),
      ...(images?.length ? { images } : {}),
    },
    ...(index ? {} : { robots: { index: false, follow: true } }),
  };
}
