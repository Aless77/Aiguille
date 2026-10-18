import { type CheerioAPI } from "cheerio";

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasType(node: JsonObject, type: string): boolean {
  const t = node["@type"];
  return t === type || (Array.isArray(t) && t.includes(type));
}

/** Tous les nœuds JSON-LD de la page, `@graph` et tableaux dépliés. Les blocs invalides sont ignorés. */
export function jsonLdNodes($: CheerioAPI): JsonObject[] {
  const nodes: JsonObject[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (isObject(value)) {
      nodes.push(value);
      if (value["@graph"]) visit(value["@graph"]);
    }
  };
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      visit(JSON.parse($(el).text()));
    } catch {
      // Bloc JSON-LD mal formé : on continue avec les autres.
    }
  });
  return nodes;
}

export interface JsonLdProduct {
  name?: string;
  sku?: string;
  description?: string;
  images: string[];
  price?: string | number;
  priceCurrency?: string;
  availability?: string;
}

/** Premier nœud `Product` de la page, réduit aux champs utiles. */
export function findProduct($: CheerioAPI): JsonLdProduct | undefined {
  const product = jsonLdNodes($).find((n) => hasType(n, "Product"));
  if (!product) return undefined;

  const offersRaw = product.offers;
  const offer = Array.isArray(offersRaw) ? offersRaw.find(isObject) : offersRaw;
  const imageRaw = product.image;
  // Une image peut être une URL ou un ImageObject ({ url }).
  const images = (Array.isArray(imageRaw) ? imageRaw : [imageRaw])
    .map((i) => (isObject(i) ? i.url : i))
    .filter((i): i is string => typeof i === "string" && i.startsWith("http"));
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

  return {
    name: str(product.name),
    sku: str(product.sku) ?? str(product.mpn),
    description: str(product.description),
    images,
    price: isObject(offer) ? (offer.price as string | number | undefined) : undefined,
    priceCurrency: isObject(offer) ? str(offer.priceCurrency) : undefined,
    availability: isObject(offer) ? str(offer.availability) : undefined,
  };
}

/** Disponibilité schema.org (« https://schema.org/InStock ») vers notre énumération. */
export function parseAvailability(
  value: string | undefined,
): "in_stock" | "out_of_stock" | "preorder" | "unknown" {
  if (!value) return "unknown";
  if (/InStock|LimitedAvailability|OnlineOnly|InStoreOnly/i.test(value)) return "in_stock";
  if (/PreOrder|PreSale|BackOrder/i.test(value)) return "preorder";
  if (/OutOfStock|SoldOut|Discontinued/i.test(value)) return "out_of_stock";
  return "unknown";
}
