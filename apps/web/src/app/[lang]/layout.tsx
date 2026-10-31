import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CountryPrompt } from "@/components/country-field";
import { BrandFavoritesProvider } from "@/lib/catalog/brand-favorites-client";
import { features } from "@/lib/features";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { getSiteUrl, isIndexable, siteConfig } from "@/lib/site";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { FallbackNotice } from "@/components/fallback-notice";
import {
  enabledLocales,
  INDEXABLE_LOCALES,
  isLocale,
  LOCALE_NAMES,
  LOCALE_TAGS,
} from "@/lib/i18n/config";
import { LocaleProvider } from "@/lib/i18n/client";
import { FeaturesProvider } from "@/lib/features-client";
import { format } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { notFound } from "next/navigation";

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Pas de canonique ici : chaque page déclare la sienne (pageMetadata), sinon toutes
// hériteraient de « / ».
const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteConfig.name} – ${siteConfig.shortDescription}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
  },
  twitter: { card: "summary_large_image" },
  robots: isIndexable() ? { index: true, follow: true } : { index: false, follow: false },
};

/** Langues publiées (variable LANGUAGES) ; le français seul par défaut. */
export async function generateStaticParams() {
  return enabledLocales().map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang) || INDEXABLE_LOCALES.includes(lang)) return metadata;
  // Langue pas encore entièrement traduite : jamais indexée (contenu partiellement en anglais).
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, locale: LOCALE_TAGS[lang].replace("-", "_") },
    robots: { index: false, follow: true },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  // Le proxy ne laisse passer que les langues publiées ; garde-fou pour un accès direct.
  if (!isLocale(lang) || !enabledLocales().includes(lang)) notFound();
  const { dict, missing } = await getDictionary();

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // Le script de thème (classe « dark ») et certaines extensions modifient <html> avant
      // l'hydratation ; ne concerne que cette balise.
      suppressHydrationWarning
    >
      <head>
        {/* Présent avant les SVG : generateMetadata peut être diffusé après le corps de page,
            trop tard pour empêcher Dark Reader de modifier les icônes avant l'hydratation. */}
        <meta name="darkreader-lock" content="true" />
      </head>
      <body className="flex min-h-full flex-col">
        {/* Thème sombre choisi par le visiteur : appliqué avant l'affichage du contenu (pas de
            flash blanc). Script inline bloquant en tête de <body>, volontairement hors de
            next/script (exécuté trop tard) et de <head> (recréé côté client par React 19). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <LocaleProvider locale={lang} dict={dict}>
          <FeaturesProvider score={features.score()} accounts={features.accounts()}>
            <BrandFavoritesProvider enabled={features.accounts()}>
              <NuqsAdapter>
                <SiteHeader />
                <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
                <SiteFooter />
                {features.accounts() && <CountryPrompt />}
                <FallbackNotice
                  messages={
                    missing.length
                      ? [format(dict.fallback.ui, { language: LOCALE_NAMES[lang] })]
                      : []
                  }
                />
              </NuqsAdapter>
            </BrandFavoritesProvider>
          </FeaturesProvider>
        </LocaleProvider>
        <JsonLd data={[websiteJsonLd(), organizationJsonLd()]} />
      </body>
    </html>
  );
}
