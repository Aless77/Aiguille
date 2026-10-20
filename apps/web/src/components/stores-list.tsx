import { type StorePoint } from "@/lib/catalog/queries";
import { COUNTRY_INFO } from "@/lib/catalog/europe-prices";
import { storeAddress, storeKey, storeMapsUrl } from "@/lib/catalog/stores";

/**
 * Adresses et liens rendus en HTML dès le chargement, accessibles sans la carte.
 */
export function StoresList({ stores }: { stores: StorePoint[] }) {
  return (
    <ul aria-label="Résultats des boutiques" className="grid gap-3 sm:grid-cols-2">
      {stores.map((store) => (
        <li
          key={storeKey(store)}
          className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground"
        >
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">
              {store.city}{" "}
              <span className="font-normal text-muted-foreground">
                · {COUNTRY_INFO[store.country]?.name ?? store.country}
              </span>
            </p>
            <h3 className="font-semibold">{store.name}</h3>
            <p className="text-xs text-muted-foreground">Boutique agréée {store.brandName}</p>
          </div>
          <p className="text-sm text-muted-foreground">{storeAddress(store)}</p>
          <a
            href={storeMapsUrl(store.name, storeAddress(store))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto text-sm font-medium underline underline-offset-4"
            aria-label={`Voir ${store.name} à ${store.city} sur Google Maps (nouvel onglet)`}
          >
            Voir sur Google Maps ↗
          </a>
        </li>
      ))}
    </ul>
  );
}
