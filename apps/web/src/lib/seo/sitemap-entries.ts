import type { MetadataRoute } from "next";

import { type Locale, LOCALE_TAGS, localizePath } from "@/lib/i18n/config";
import { absoluteUrl } from "@/lib/site";

type Entry = MetadataRoute.Sitemap[number];

/**
 * Une entrée de sitemap par langue indexable, chacune reliée aux autres versions (hreflang).
 * Avec le français seul, une entrée simple, comme avant le multilingue.
 */
export function localizedEntries(
  path: string,
  locales: readonly Locale[],
  extra: Omit<Entry, "url"> = {},
): Entry[] {
  const languages =
    locales.length > 1
      ? Object.fromEntries(locales.map((l) => [LOCALE_TAGS[l], absoluteUrl(localizePath(l, path))]))
      : undefined;
  return locales.map((l) => ({
    url: absoluteUrl(localizePath(l, path)),
    ...extra,
    ...(languages ? { alternates: { languages } } : {}),
  }));
}
