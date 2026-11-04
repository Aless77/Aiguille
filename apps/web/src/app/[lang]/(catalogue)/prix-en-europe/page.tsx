import { Breadcrumbs } from "@/components/breadcrumbs";
import { EuropeMap } from "@/components/europe-map";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildEuropeIndex, type CountryIndex } from "@/lib/catalog/europe-index";
import { getLatestRates, getOfficialCountryPrices } from "@/lib/catalog/queries";
import { type Dictionary, format } from "@/lib/i18n/dictionary";
import { type Formatters } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/seo/localized-metadata";

export async function generateMetadata() {
  const { dict } = await getDictionary();
  return localizedMetadata({
    title: dict.pages.europe.metaTitle,
    description: dict.pages.europe.metaDescription,
    path: "/prix-en-europe",
  });
}

const signed = (n: number, f: Formatters) => `${n > 0 ? "+" : ""}${f.number(n)} %`;

function brandSummary(
  brandName: string,
  countries: CountryIndex[],
  t: Dictionary["pages"]["europe"],
  f: Formatters,
): string {
  const cheapest = countries[0];
  const priciest = countries.at(-1);
  if (!cheapest || !priciest) return "";
  const parts = [];
  if (cheapest.medianDeltaPercent < 0)
    parts.push(
      format(t.cheapest, {
        brand: brandName,
        country: f.country(cheapest.country),
        delta: signed(cheapest.medianDeltaPercent, f),
      }),
    );
  if (priciest.medianDeltaPercent > 0)
    parts.push(
      format(t.priciest, {
        country: f.country(priciest.country),
        delta: signed(priciest.medianDeltaPercent, f),
      }),
    );
  return parts.length ? parts.join(" ") : format(t.aligned, { brand: brandName });
}

/**
 * Indice des prix européens par marque (cahier des charges, lot 4 : « carte par pays, prix
 * moyen ou disponibilité »). Médiane des écarts avec la France sur les mêmes références.
 */
export default async function EuropePricesPage() {
  const [rows, rates, { dict, f }] = await Promise.all([
    getOfficialCountryPrices(),
    getLatestRates(),
    getDictionary(),
  ]);
  const t = dict.pages.europe;
  const index = buildEuropeIndex(rows, rates.unitsPerEur);

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Breadcrumbs crumbs={[{ name: t.breadcrumb }]} />
        <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
        <p className="max-w-3xl text-muted-foreground">{t.intro}</p>
      </div>

      {index.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-muted-foreground">{t.empty}</p>
      )}

      {index.map((brand) => (
        <section
          key={brand.brandSlug}
          className="space-y-4"
          aria-labelledby={`marque-${brand.brandSlug}`}
        >
          <h2 id={`marque-${brand.brandSlug}`} className="text-2xl font-semibold tracking-tight">
            {brand.brandName}
          </h2>
          <p className="max-w-3xl leading-relaxed">
            {brandSummary(brand.brandName, brand.countries, t, f)}
          </p>
          <div className="rounded-xl border p-2">
            <EuropeMap
              data={brand.countries.map((c) => ({
                isoNumeric: c.isoNumeric,
                name: f.country(c.country),
                deltaPercent: c.medianDeltaPercent,
                label: format(t.mapValue, {
                  delta: signed(c.medianDeltaPercent, f),
                  count: f.number(c.compared, 0),
                }),
              }))}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.country}</TableHead>
                <TableHead>{t.delta}</TableHead>
                <TableHead>{t.compared}</TableHead>
                <TableHead>{t.stock}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brand.countries.map((c) => (
                <TableRow key={c.country}>
                  <TableCell className="font-medium">{f.country(c.country)}</TableCell>
                  <TableCell
                    className={
                      c.medianDeltaPercent < 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : c.medianDeltaPercent > 0
                          ? "text-red-600 dark:text-red-400"
                          : undefined
                    }
                  >
                    {signed(c.medianDeltaPercent, f)}
                  </TableCell>
                  <TableCell>{f.number(c.compared, 0)}</TableCell>
                  <TableCell>{f.number(c.inStockPercent)} %</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ))}

      {rates.date && (
        <p className="text-sm text-muted-foreground">
          {format(t.rates, { date: f.date(rates.date) })}
        </p>
      )}
    </div>
  );
}
