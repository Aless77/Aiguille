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
import { formatDate } from "@/lib/catalog/format";
import { getLatestRates, getOfficialCountryPrices } from "@/lib/catalog/queries";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  title: "Prix des montres en Europe : où acheter moins cher ?",
  description:
    "Écart de prix médian avec la France pour Tissot, Hamilton et Longines dans 14 pays européens, à partir des prix catalogue officiels convertis en euros.",
  path: "/prix-en-europe",
});

const signed = (n: number) => `${n > 0 ? "+" : ""}${n.toLocaleString("fr-FR")} %`;

function brandSummary(brandName: string, countries: CountryIndex[]): string {
  const cheapest = countries[0];
  const priciest = countries.at(-1);
  if (!cheapest || !priciest) return "";
  const parts = [];
  if (cheapest.medianDeltaPercent < 0)
    parts.push(
      `les montres ${brandName} sont les moins chères ${cheapest.inName} (${signed(cheapest.medianDeltaPercent)} en médiane par rapport à la France)`,
    );
  if (priciest.medianDeltaPercent > 0)
    parts.push(`les plus chères ${priciest.inName} (${signed(priciest.medianDeltaPercent)})`);
  return parts.length
    ? `Après conversion en euros, ${parts.join(", et ")}.`
    : `Les prix ${brandName} sont alignés sur la France dans les pays relevés.`;
}

/**
 * Indice des prix européens par marque (cahier des charges, lot 4 : « carte par pays, prix
 * moyen ou disponibilité »). Médiane des écarts avec la France sur les mêmes références.
 */
export default async function EuropePricesPage() {
  const [rows, rates] = await Promise.all([getOfficialCountryPrices(), getLatestRates()]);
  const index = buildEuropeIndex(rows, rates.unitsPerEur);

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Breadcrumbs crumbs={[{ name: "Prix en Europe" }]} />
        <h1 className="text-3xl font-semibold tracking-tight">Prix des montres en Europe</h1>
        <p className="max-w-3xl text-muted-foreground">
          Pour chaque marque et chaque pays, écart médian entre le prix catalogue officiel national
          (converti en euros) et le prix français des mêmes références. Les prix étrangers incluent
          la TVA locale ; acheter à l&apos;étranger implique d&apos;y acheter sur place et d&apos;y
          faire valoir la garantie.
        </p>
      </div>

      {index.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-muted-foreground">
          Les prix nationaux sont en cours de relevé : chaque pays est revu une fois par semaine.
        </p>
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
            {brandSummary(brand.brandName, brand.countries)}
          </p>
          <div className="rounded-xl border p-2">
            <EuropeMap
              data={brand.countries.map((c) => ({
                isoNumeric: c.isoNumeric,
                name: c.name,
                deltaPercent: c.medianDeltaPercent,
                label: `${signed(c.medianDeltaPercent)} en médiane (${c.compared} montres)`,
              }))}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pays</TableHead>
                <TableHead>Écart médian avec la France</TableHead>
                <TableHead>Montres comparées</TableHead>
                <TableHead>En stock sur le site national</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brand.countries.map((c) => (
                <TableRow key={c.country}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell
                    className={
                      c.medianDeltaPercent < 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : c.medianDeltaPercent > 0
                          ? "text-red-600 dark:text-red-400"
                          : undefined
                    }
                  >
                    {signed(c.medianDeltaPercent)}
                  </TableCell>
                  <TableCell>{c.compared}</TableCell>
                  <TableCell>{c.inStockPercent} %</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ))}

      {rates.date && (
        <p className="text-sm text-muted-foreground">
          Conversion au taux de référence de la BCE du {formatDate(rates.date)}.
        </p>
      )}
    </div>
  );
}
