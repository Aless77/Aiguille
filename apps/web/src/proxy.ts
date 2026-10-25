import { type NextRequest, NextResponse } from "next/server";

import { DEFAULT_LOCALE, enabledLocales, isLocale } from "@/lib/i18n/config";

/**
 * Routage des langues (lib/i18n/config.ts). Toutes les pages vivent sous app/[lang] :
 * - /montres → réécrit en interne vers /fr/montres (URL françaises inchangées) ;
 * - /en/montres → servi tel quel si l'anglais est publié (LANGUAGES), sinon 404 ;
 * - /fr/montres → redirigé vers /montres (une seule URL par page).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (first === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (isLocale(first) && enabledLocales().includes(first)) return NextResponse.next();

  // Langue non publiée ou chemin sans langue : version française (une langue non publiée
  // devient /fr/en/…, inconnu, donc 404).
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  // Ni l'API, ni les ressources Next, ni les fichiers (robots.txt, sitemap.xml, favicon.ico…).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
