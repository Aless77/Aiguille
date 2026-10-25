import { enabledLocales, INDEXABLE_LOCALES } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";

import { pageMetadata } from "./metadata";

/** pageMetadata dans la langue de la page, avec hreflang vers les autres langues indexables. */
export async function localizedMetadata(input: Parameters<typeof pageMetadata>[0]) {
  return pageMetadata({
    ...input,
    locale: await getLocale(),
    alternateLocales: enabledLocales().filter((l) => INDEXABLE_LOCALES.includes(l)),
  });
}
