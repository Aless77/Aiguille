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
  /** Offres en cours (marque et revendeurs), voir currentOffers(). */
  offers: {
    priceCents: number;
    availability: "in_stock" | "out_of_stock" | "preorder" | "unknown";
  }[];
  /**
   * Avis déposés sur le site (lot 5) : AggregateRating sur 5 et les avis les plus récents. Notre
   * note sur 100 n'y figure pas : ce n'est pas une moyenne d'avis (règles Google).
   */
  reviews?: {
    average: number;
    count: number;
    items: { author: string; date: Date; rating: number; body: string | null }[];
  };
}

const AVAILABILITY_ORDER = ["in_stock", "preorder", "out_of_stock"] as const;

const SCHEMA_AVAILABILITY = {
  in_stock: "https://schema.org/InStock",
  out_of_stock: "https://schema.org/OutOfStock",
  preorder: "https://schema.org/PreOrder",
} as const;

/**
 * Fiche montre (docs/seo/donnees-structurees.md) : AggregateOffer car nous ne vendons pas, et
 * aucun AggregateRating tant que les avis ne sont pas collectés sur le site (lot 5).
 */
export function productJsonLd(p: ProductInput): WithContext<Product> {
  const prices = p.offers.map((o) => o.priceCents / 100);
  // Meilleure disponibilité parmi les offres ; inconnue partout : propriété omise.
  const availability = AVAILABILITY_ORDER.find((a) => p.offers.some((o) => o.availability === a));
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
    ...(prices.length
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "EUR",
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: prices.length,
            ...(availability ? { availability: SCHEMA_AVAILABILITY[availability] } : {}),
          },
        }
      : {}),
    ...(p.reviews && p.reviews.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Math.round(p.reviews.average * 10) / 10,
            bestRating: 5,
            worstRating: 1,
            ratingCount: p.reviews.count,
          },
          review: p.reviews.items.slice(0, 5).map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.author },
            datePublished: r.date.toISOString().slice(0, 10),
            reviewRating: {
              "@type": "Rating",
              ratingValue: Math.round(r.rating * 10) / 10,
              bestRating: 5,
              worstRating: 1,
            },
            ...(r.body ? { reviewBody: r.body } : {}),
          })),
        }
      : {}),
  };
}
