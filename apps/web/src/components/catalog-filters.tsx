"use client";

import { SlidersHorizontal } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MOVEMENT_LABELS } from "@/lib/catalog/format";
import { type Facets } from "@/lib/catalog/queries";
import { catalogParsers } from "@/lib/catalog/search-params";
import { type Sort } from "@/lib/catalog/types";

const SORT_LABELS: Record<Sort, string> = {
  "prix-asc": "Prix croissant",
  "prix-desc": "Prix décroissant",
  note: "Meilleure Note Aiguille",
  avis: "Mieux notées par la communauté",
  nom: "Nom",
  recents: "Plus récents",
};

const inputClass =
  "h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Filtres du catalogue, synchronisés avec l'URL (nuqs). `shallow: false` relance le rendu serveur
 * de la page : la liste est toujours calculée côté serveur, donc indexable et partageable.
 */
export function CatalogFilters({
  facets,
  hiddenSorts = [],
}: {
  facets: Facets;
  /** Tris liés à une fonctionnalité masquée (lib/features.ts). */
  hiddenSorts?: Sort[];
}) {
  const [isPending, startTransition] = useTransition();
  // Mobile : repliés par défaut pour laisser voir les résultats. Ordinateur : toujours visibles.
  const [open, setOpen] = useState(false);
  const [params, setParams] = useQueryStates(catalogParsers, { shallow: false, startTransition });

  // Toute modification de filtre ramène à la première page.
  const update = (values: Partial<typeof params>) => setParams({ ...values, page: 1 });
  const toggle = <T extends string>(list: T[], value: T, on: boolean) =>
    on ? [...list, value] : list.filter((v) => v !== value);
  const numberOrNull = (value: string) => (value === "" ? null : Math.max(0, Number(value)));

  const activeCount =
    params.marque.length +
    params.mouvement.length +
    [params.prixMin, params.prixMax, params.diametreMin, params.diametreMax].filter(
      (v) => v !== null,
    ).length;

  return (
    <div aria-busy={isPending}>
      <Button
        variant="outline"
        className="lg:hidden"
        aria-expanded={open}
        aria-controls="filtres-catalogue"
        onClick={() => setOpen((o) => !o)}
      >
        <SlidersHorizontal aria-hidden />
        Filtres{activeCount > 0 && ` (${activeCount})`}
      </Button>

      <div
        id="filtres-catalogue"
        className={`space-y-6 pt-4 lg:block lg:pt-0 ${open ? "block" : "hidden"}`}
      >
        <label className="block space-y-2 text-sm">
          <span className="font-medium">Trier par</span>
          <select
            className={inputClass}
            value={params.tri}
            onChange={(e) => update({ tri: e.target.value as Sort })}
          >
            {(Object.entries(SORT_LABELS) as [Sort, string][])
              .filter(([value]) => !hiddenSorts.includes(value))
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </select>
        </label>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Marque</legend>
          {facets.brands.map((b) => (
            <label key={b.slug} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={params.marque.includes(b.slug)}
                onCheckedChange={(on) => update({ marque: toggle(params.marque, b.slug, on) })}
              />
              {b.name}
              <span className="text-muted-foreground">({b.count})</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Mouvement</legend>
          {facets.movements.map((m) => (
            <label key={m.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={params.mouvement.includes(m.value)}
                onCheckedChange={(on) =>
                  update({ mouvement: toggle(params.mouvement, m.value, on) })
                }
              />
              {MOVEMENT_LABELS[m.value]}
              <span className="text-muted-foreground">({m.count})</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Prix (€)</legend>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              aria-label="Prix minimum en euros"
              placeholder="Min"
              className={inputClass}
              key={`prixMin-${params.prixMin}`}
              defaultValue={params.prixMin ?? ""}
              onBlur={(e) => update({ prixMin: numberOrNull(e.target.value) })}
            />
            <span aria-hidden>–</span>
            <input
              type="number"
              inputMode="numeric"
              aria-label="Prix maximum en euros"
              placeholder="Max"
              className={inputClass}
              key={`prixMax-${params.prixMax}`}
              defaultValue={params.prixMax ?? ""}
              onBlur={(e) => update({ prixMax: numberOrNull(e.target.value) })}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Diamètre (mm)</legend>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              aria-label="Diamètre minimum en millimètres"
              placeholder="Min"
              className={inputClass}
              key={`diametreMin-${params.diametreMin}`}
              defaultValue={params.diametreMin ?? ""}
              onBlur={(e) => update({ diametreMin: numberOrNull(e.target.value) })}
            />
            <span aria-hidden>–</span>
            <input
              type="number"
              inputMode="numeric"
              aria-label="Diamètre maximum en millimètres"
              placeholder="Max"
              className={inputClass}
              key={`diametreMax-${params.diametreMax}`}
              defaultValue={params.diametreMax ?? ""}
              onBlur={(e) => update({ diametreMax: numberOrNull(e.target.value) })}
            />
          </div>
        </fieldset>

        {activeCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => setParams(null)}>
            Effacer les filtres
          </Button>
        )}
      </div>
    </div>
  );
}
