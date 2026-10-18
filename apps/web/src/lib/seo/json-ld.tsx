import type {
  BreadcrumbList,
  ItemList,
  Organization,
  Product,
  Thing,
  WebSite,
  WithContext,
} from "schema-dts";

import { absoluteUrl, siteConfig } from "@/lib/site";

type JsonLdData = WithContext<Thing> | WithContext<Thing>[];

/**
 * Sérialise un objet JSON-LD pour l'insérer dans une balise <script>.
 * `<` est échappé pour empêcher toute fermeture prématurée de la balise (XSS),
 * comme le recommande la doc Next.js (guides/json-ld).
 */
export function serializeJsonLd(data: JsonLdData): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Balise JSON-LD à placer dans un layout ou une page (rendu serveur). */
export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

export function websiteJsonLd(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    inLanguage: siteConfig.language,
  };
}

export function organizationJsonLd(): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: absoluteUrl("/"),
    sameAs: [siteConfig.repository],
  };
}

export interface Crumb {
  name: string;
  /** Chemin relatif ; absent pour la page courante. */
  path?: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: absoluteUrl(c.path) } : {}),
    })),
  };
}

export function itemListJsonLd(items: { name: string; path: string }[]): WithContext<ItemList> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

export interface ProductInput {
  name: string;
  reference: string;
  brandName: string;
  description: string;
  path: string;
  imageUrls: string[];
  priceCents: number | null;
  inStock: boolean;
}

/**
 * Fiche montre (docs/seo/donnees-structurees.md) : AggregateOffer car nous ne vendons pas, et
 * aucun AggregateRating tant que les avis ne sont pas collectés sur le site (lot 5).
 */
export function productJsonLd(p: ProductInput): WithContext<Product> {
  const price = p.priceCents === null ? null : p.priceCents / 100;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.reference,
    mpn: p.reference,
    brand: { "@type": "Brand", name: p.brandName },
    description: p.description,
    url: absoluteUrl(p.path),
    ...(p.imageUrls.length ? { image: p.imageUrls } : {}),
    ...(price !== null
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "EUR",
            lowPrice: price,
            highPrice: price,
            offerCount: 1,
            availability: p.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };
}
