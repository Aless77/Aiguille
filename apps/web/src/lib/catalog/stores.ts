import { COUNTRY_INFO } from "./europe-prices";
import { type StorePoint } from "./queries";

export interface StoreBounds {
  west: number;
  east: number;
  south: number;
  north: number;
}

/** Longitude déroulée par MapLibre : une zone peut traverser le méridien ±180°. */
export function storesInBounds(stores: StorePoint[], bounds: StoreBounds | null): StorePoint[] {
  if (!bounds) return stores;
  return stores.filter((store) => {
    if (store.latitude < bounds.south || store.latitude > bounds.north) return false;
    const longitude = (((store.longitude - bounds.west) % 360) + 360) % 360;
    const width = bounds.east - bounds.west;
    return width >= 360 || longitude <= ((width % 360) + 360) % 360;
  });
}

export function storeAddress(store: StorePoint): string {
  return [
    store.street,
    [store.postalCode, store.city].filter(Boolean).join(" "),
    COUNTRY_INFO[store.country]?.name ?? store.country,
  ]
    .filter(Boolean)
    .join(", ");
}

/** Recherche de l'établissement par nom ET adresse, sans clé ni collecte Google. */
export function storeMapsUrl(name: string, address: string): string {
  const params = new URLSearchParams({ api: "1", query: `${name}, ${address}` });
  return `https://www.google.com/maps/search/?${params}`;
}

export function storeKey(store: StorePoint): string {
  return [store.brandSlug, store.name, store.street, store.city, store.country].join("|");
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("fr")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Tous les mots doivent correspondre, même si l'ordre ou les accents diffèrent. */
export function searchStores(stores: StorePoint[], query: string): StorePoint[] {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return stores;
  return stores.filter((store) => {
    const text = normalizeSearch(
      [store.name, storeAddress(store), store.country, store.brandName].join(" "),
    );
    return terms.every((term) => text.includes(term));
  });
}
