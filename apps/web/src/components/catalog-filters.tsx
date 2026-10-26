"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { debounce, useQueryStates } from "nuqs";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { localize } from "@aiguille/db/i18n";
import { type Facets } from "@/lib/catalog/queries";
import { catalogParsers, catalogRange } from "@/lib/catalog/search-params";
import { type Sort, type FacetOption, TECHNICAL_FILTER_KEYS } from "@/lib/catalog/types";
import { useLocale } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

const inputClass =
  "h-9 min-w-0 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** Recherche toujours visible ; les autres critères sont repliables sur mobile. */
export function CatalogFilters({
  facets,
  hiddenSorts = [],
  scoped = false,
}: {
  facets: Facets;
  hiddenSorts?: Sort[];
  scoped?: boolean;
}) {
  const { locale, dict } = useLocale();
  const c = dict.catalog;
  const t = c.filters;
  // Libellés de choix : complications traduites par packages/db, le reste par le dictionnaire.
  const facetLabel = (label: string) => c.facets[label] ?? localize(label, locale);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [params, setParams] = useQueryStates(catalogParsers, { shallow: false, startTransition });
  const update = (values: Partial<typeof params>) => setParams({ ...values, page: 1 });
  const toggle = <T extends string>(list: T[], value: T, on: boolean) =>
    on ? [...list, value] : list.filter((v) => v !== value);
  const advancedCount =
    TECHNICAL_FILTER_KEYS.reduce((count, key) => count + params[key].length, 0) +
    [
      params.etancheiteMin,
      params.reserveMin,
      params.epaisseurMax,
      params.entrecornes,
      params.garantieMin,
      params.statut,
    ].filter((v) => v !== null).length +
    Number(params.enStock);
  const activeCount =
    advancedCount +
    (scoped ? 0 : params.marque.length) +
    params.mouvement.length +
    [params.prixMin, params.prixMax, params.diametreMin, params.diametreMax].filter(
      (v) => v !== null,
    ).length +
    (params.recherche ? 1 : 0);

  return (
    <div aria-busy={isPending} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">{t.search}</span>
        <span className="relative">
          <Search
            className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            className={cn(inputClass, "pl-8")}
            placeholder={t.searchPlaceholder}
            maxLength={120}
            value={params.recherche}
            onChange={(e) =>
              setParams({ recherche: e.target.value, page: 1 }, { limitUrlUpdates: debounce(300) })
            }
          />
        </span>
        <span className="text-xs text-muted-foreground">{t.searchHint}</span>
      </label>
      <Button
        variant="outline"
        className="lg:hidden"
        aria-expanded={open}
        aria-controls="filtres-catalogue"
        onClick={() => setOpen((o) => !o)}
      >
        <SlidersHorizontal aria-hidden />
        {t.toggle}
        {activeCount > 0 && ` (${activeCount})`}
      </Button>
      <div
        id="filtres-catalogue"
        className={cn("flex-col gap-6 lg:flex", open ? "flex" : "hidden")}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">{t.movement}</legend>
          {facets.movements.map((m) => (
            <label key={m.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={params.mouvement.includes(m.value)}
                onCheckedChange={(on) =>
                  update({ mouvement: toggle(params.mouvement, m.value, on) })
                }
              />
              {c.movements[m.value]}
              <span className="text-muted-foreground">({m.count})</span>
            </label>
          ))}
        </fieldset>
        {/* À l'ouverture mobile, remesurer les curseurs initialisés dans le panneau masqué. */}
        <RangeFilter
          key={`prix-${open}-${params.prixMin}-${params.prixMax}`}
          title={t.price}
          name={t.priceName}
          unit={t.euros}
          min={facets.priceMinCents === null ? 0 : Math.floor(facets.priceMinCents / 5000) * 50}
          max={facets.priceMaxCents === null ? 1000 : Math.ceil(facets.priceMaxCents / 5000) * 50}
          low={params.prixMin}
          high={params.prixMax}
          step={50}
          onCommit={(prixMin, prixMax) => update({ prixMin, prixMax })}
        />
        <RangeFilter
          key={`diametre-${open}-${params.diametreMin}-${params.diametreMax}`}
          title={t.diameter}
          name={t.diameterName}
          unit={t.millimetres}
          min={Math.floor(facets.diameterMinMm ?? 20)}
          max={Math.ceil(facets.diameterMaxMm ?? 50)}
          low={params.diametreMin}
          high={params.diametreMax}
          step={1}
          onCommit={(diametreMin, diametreMax) => update({ diametreMin, diametreMax })}
        />
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">{t.sortBy}</span>
          <select
            className={inputClass}
            value={params.tri}
            onChange={(e) => update({ tri: e.target.value as Sort })}
          >
            {(Object.entries(c.sorts) as [Sort, string][])
              .filter(([value]) => !hiddenSorts.includes(value))
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </select>
        </label>
        {!scoped && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">{t.brand}</legend>
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
        )}
        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            {t.more}
            {advancedCount > 0 && ` (${advancedCount})`}
          </summary>
          <div className="mt-4 flex flex-col gap-5">
            <p className="text-xs text-muted-foreground">{t.moreHint}</p>
            {TECHNICAL_FILTER_KEYS.map(
              (key) =>
                facets.technical[key].length > (key === "collection" ? 1 : 0) && (
                  <FacetChecklist
                    key={key}
                    title={c.technical[key]}
                    labelOf={facetLabel}
                    options={facets.technical[key]}
                    selected={params[key]}
                    onChange={(value, checked) =>
                      update({ [key]: toggle(params[key], value, checked) })
                    }
                  />
                ),
            )}
            <NumberChoice
              label={t.water}
              anyLabel={t.any}
              value={params.etancheiteMin}
              choices={[30, 50, 100, 200, 300, 500, 1000].map((value) => [
                value,
                format(t.waterChoice, { n: value }),
              ])}
              onChange={(etancheiteMin) => update({ etancheiteMin })}
            />
            <NumberChoice
              label={t.reserve}
              anyLabel={t.any}
              value={params.reserveMin}
              choices={[24, 40, 60, 80, 120].map((value) => [
                value,
                format(t.reserveChoice, { n: value }),
              ])}
              onChange={(reserveMin) => update({ reserveMin })}
            />
            <NumberChoice
              label={t.warranty}
              anyLabel={t.any}
              value={params.garantieMin}
              choices={[24, 36, 60].map((value) => [
                value,
                format(t.warrantyChoice, { n: value / 12 }),
              ])}
              onChange={(garantieMin) => update({ garantieMin })}
            />
            <label className="flex flex-col gap-2 text-sm">
              {t.thickness}
              <input
                className={inputClass}
                type="number"
                min={0}
                step={0.1}
                inputMode="decimal"
                placeholder={t.any}
                key={`epaisseur-${params.epaisseurMax}`}
                defaultValue={params.epaisseurMax ?? ""}
                onBlur={(e) =>
                  update({ epaisseurMax: e.target.value === "" ? null : Number(e.target.value) })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              {t.lugWidth}
              <input
                className={inputClass}
                type="number"
                min={0}
                step={0.1}
                inputMode="decimal"
                placeholder={t.any}
                key={`entrecornes-${params.entrecornes}`}
                defaultValue={params.entrecornes ?? ""}
                onBlur={(e) =>
                  update({ entrecornes: e.target.value === "" ? null : Number(e.target.value) })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              {t.production}
              <select
                className={inputClass}
                value={params.statut ?? ""}
                onChange={(e) =>
                  update({
                    statut:
                      e.target.value === "active"
                        ? "active"
                        : e.target.value === "arretee"
                          ? "arretee"
                          : null,
                  })
                }
              >
                <option value="">{t.allReferences}</option>
                <option value="active">{t.stillMade}</option>
                <option value="arretee">{t.discontinued}</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={params.enStock}
                onCheckedChange={(enStock) => update({ enStock })}
              />
              {t.inStock}
            </label>
            <p className="text-xs text-muted-foreground">{t.stockHint}</p>
          </div>
        </details>
        {activeCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => setParams(null)}>
            {t.clear}
          </Button>
        )}
      </div>
      {isPending && (
        <p role="status" className="text-xs text-muted-foreground">
          {t.updating}
        </p>
      )}
    </div>
  );
}

function FacetChecklist({
  title,
  labelOf,
  options,
  selected,
  onChange,
}: {
  title: string;
  labelOf: (label: string) => string;
  options: FacetOption[];
  selected: string[];
  onChange: (value: string, checked: boolean) => void;
}) {
  return (
    <details>
      <summary className="cursor-pointer text-sm font-medium">
        {title}
        {selected.length > 0 && ` (${selected.length})`}
      </summary>
      <fieldset
        aria-label={title}
        className="mt-3 flex max-h-48 flex-col gap-2 overflow-y-auto pr-1"
      >
        {options.map((option) => (
          <label key={option.value} className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={selected.includes(option.value)}
              onCheckedChange={(checked) => onChange(option.value, checked)}
            />
            <span className="min-w-0 break-words">
              {labelOf(option.label)}{" "}
              <span className="text-muted-foreground">({option.count})</span>
            </span>
          </label>
        ))}
      </fieldset>
    </details>
  );
}

function NumberChoice({
  label,
  anyLabel,
  value,
  choices,
  onChange,
}: {
  label: string;
  anyLabel: string;
  value: number | null;
  choices: [number, string][];
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      {label}
      <select
        className={inputClass}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      >
        <option value="">{anyLabel}</option>
        {choices.map(([number, text]) => (
          <option value={number} key={number}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Valeur locale pendant le glissement, requête serveur seulement au relâchement. */
function RangeFilter({
  title,
  name,
  unit,
  min,
  max,
  low,
  high,
  step,
  onCommit,
}: {
  title: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  low: number | null;
  high: number | null;
  step: number;
  onCommit: (low: number | null, high: number | null) => void;
}) {
  const [validLow, validHigh] = catalogRange(low, high);
  const lower = Math.min(min, validLow ?? min, validHigh ?? min);
  const upper = Math.max(max, validHigh ?? max, validLow ?? max, lower + step);
  const [draft, setDraft] = useState<number[]>([validLow ?? lower, validHigh ?? upper]);
  const { dict } = useLocale();
  const t = dict.catalog.filters;
  const commit = (index: 0 | 1, value: string) => {
    const candidate = value === "" ? null : Number(value);
    const [a, b] = catalogRange(
      index === 0 ? candidate : validLow,
      index === 1 ? candidate : validHigh,
    );
    onCommit(a, b);
  };
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-3 text-sm font-medium">{title}</legend>
      <Slider
        min={lower}
        max={upper}
        step={step}
        value={draft}
        className="py-2"
        aria-label={title}
        thumbLabels={[format(t.thumbMin, { name, unit }), format(t.thumbMax, { name, unit })]}
        onValueChange={(value) => setDraft(Array.isArray(value) ? [...value] : [value])}
        onValueCommitted={(value) => {
          if (Array.isArray(value))
            onCommit(value[0] === lower ? null : value[0]!, value[1] === upper ? null : value[1]!);
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        {([0, 1] as const).map((index) => (
          <label key={index} className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
            {index === 0 ? t.minimum : t.maximum}
            <input
              type="number"
              min={0}
              step={step}
              inputMode="decimal"
              className={inputClass}
              aria-label={format(index === 0 ? t.thumbMin : t.thumbMax, { name, unit })}
              key={`${index}-${draft[index]}`}
              defaultValue={
                (index === 0 ? validLow : validHigh) === null &&
                draft[index] === (index === 0 ? lower : upper)
                  ? ""
                  : draft[index]
              }
              placeholder={String(index === 0 ? min : max)}
              onBlur={(e) => commit(index, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
