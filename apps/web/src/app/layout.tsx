import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { getSiteUrl, isIndexable, siteConfig } from "@/lib/site";

import "./globals.css";

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
export const metadata: Metadata = {
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
  // Le site a son propre thème sombre : demande à Dark Reader de ne pas réécrire la page (sinon
  // ses attributs injectés provoquent des erreurs d'hydratation et faussent les couleurs).
  // Une valeur vide est omise par Next.js : il faut une valeur non vide pour émettre la balise.
  other: { "darkreader-lock": "true" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={siteConfig.language}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // Des extensions (Dark Reader…) modifient <html> avant l'hydratation ; ne concerne que cette balise.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <NuqsAdapter>
          <SiteHeader />
          <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
          <SiteFooter />
        </NuqsAdapter>
        <JsonLd data={[websiteJsonLd(), organizationJsonLd()]} />
      </body>
    </html>
  );
}
