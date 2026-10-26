"use client";

import { type StorePoint } from "@/lib/catalog/queries";
import { storeAddress, storeKey, storeMapsUrl } from "@/lib/catalog/stores";
import { useLocale } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";

/**
 * Adresses et liens rendus en HTML dès le chargement, accessibles sans la carte.
 */
export function StoresList({ stores }: { stores: StorePoint[] }) {
  const { dict, f } = useLocale();
  const t = dict.community.stores;
  return (
    <ul aria-label={t.results} className="grid gap-3 sm:grid-cols-2">
      {stores.map((store) => (
        <li
          key={storeKey(store)}
          className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground"
        >
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">
              {store.city}{" "}
              <span className="font-normal text-muted-foreground">
                · {f.country(store.country)}
              </span>
            </p>
            <h3 className="font-semibold">{store.name}</h3>
            <p className="text-xs text-muted-foreground">
              {format(t.authorised, { brand: store.brandName })}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{storeAddress(store)}</p>
          <a
            href={storeMapsUrl(store.name, storeAddress(store))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto text-sm font-medium underline underline-offset-4"
            aria-label={format(t.mapsLabel, { name: store.name, city: store.city })}
          >
            {t.maps}
          </a>
        </li>
      ))}
    </ul>
  );
}
