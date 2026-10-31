import { type NextRequest, NextResponse } from "next/server";

import { DEFAULT_LOCALE, enabledLocales, isLocale } from "@/lib/i18n/config";
import { localizePath, splitLocale } from "@/lib/i18n/config";
import { approvedSession } from "@/lib/auth/access";
import { ADMIN_COOKIE, validAdminToken } from "@/lib/auth/admin-token";
import { ADMIN_ENTRY_HEADER, getAdminAccessPath } from "@/lib/auth/admin-path";

/**
 * Routage des langues (lib/i18n/config.ts). Toutes les pages vivent sous app/[lang] :
 * - /montres → réécrit en interne vers /fr/montres (URL françaises inchangées) ;
 * - /en/montres → servi tel quel si l'anglais est publié (LANGUAGES), sinon 404 ;
 * - /fr/montres → redirigé vers /montres (une seule URL par page).
 */
export async function proxy(request: NextRequest) {
  const response = await routeRequest(request);
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

async function routeRequest(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];

  const { locale, path } = splitLocale(pathname);
  const requestHeaders = new Headers(request.headers);
  // Ne jamais faire confiance à un marqueur envoyé par le navigateur.
  requestHeaders.delete(ADMIN_ENTRY_HEADER);
  const adminPath = getAdminAccessPath();
  const unprefixedPath =
    first === DEFAULT_LOCALE ? pathname.slice(DEFAULT_LOCALE.length + 1) : path;
  // La route interne n'est jamais une entrée publique, même avec une session administrateur.
  if (unprefixedPath === "/administration") return new NextResponse(null, { status: 404 });
  if (
    adminPath &&
    path === adminPath &&
    (first === undefined || !isLocale(first) || enabledLocales().includes(first))
  ) {
    requestHeaders.set(ADMIN_ENTRY_HEADER, "1");
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/administration`;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  const publicPage = ["/connexion", "/demande-acces", "/confidentialite", "/compte"].includes(path);
  const publicResource = [
    "/robots.txt",
    "/sitemap.xml",
    "/favicon.ico",
    "/icon.svg",
    "/manifest.webmanifest",
  ].includes(pathname);
  const authApi = pathname.startsWith("/api/auth/");
  const machineApi = pathname === "/api/revalidate";
  if (!publicPage && !publicResource && !authApi && !machineApi && first !== DEFAULT_LOCALE) {
    const admin = validAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);
    if (!admin && !(await approvedSession(request.headers))) {
      if (pathname.startsWith("/api/"))
        return NextResponse.json(
          { error: "Accès réservé aux comptes approuvés." },
          { status: 403, headers: { "Cache-Control": "private, no-store" } },
        );
      return NextResponse.redirect(new URL(localizePath(locale, "/demande-acces"), request.url));
    }
  }
  if (publicResource || authApi || machineApi || pathname.startsWith("/api/"))
    return NextResponse.next({ request: { headers: requestHeaders } });

  if (first === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (isLocale(first) && enabledLocales().includes(first))
    return NextResponse.next({ request: { headers: requestHeaders } });

  // Langue non publiée ou chemin sans langue : version française (une langue non publiée
  // devient /fr/en/…, inconnu, donc 404).
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  // Seuls les fichiers techniques Next sont exclus ; API et chemins contenant un point protégés.
  matcher: ["/((?!_next/static|_next/image|_next/webpack-hmr).*)"],
};
