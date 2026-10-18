import type { Organization, Thing, WebSite, WithContext } from "schema-dts";

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
