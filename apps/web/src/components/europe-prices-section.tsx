import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type EuropePrice, europeSummary } from "@/lib/catalog/europe-prices";
import { formatDate, formatPrice } from "@/lib/catalog/format";
import { AVAILABILITY_LABELS } from "@/lib/catalog/price-history";

import { EuropeMap } from "./europe-map";

const localPrice = (cents: number, currency: string) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 })
    .format(cents / 100)
    .replace(/ /g, " ");

const delta = (p: EuropePrice) =>
  p.deltaPercent === null || p.country === "FR"
    ? "—"
    : `${p.deltaPercent > 0 ? "+" : ""}${p.deltaPercent.toLocaleString("fr-FR")} %`;

/**
 * Prix officiels de la montre dans les pays européens couverts, convertis en euros (lot 4).
 * Résumé et tableau dans le HTML serveur ; la carte n'est qu'une aide visuelle.
 */
export function EuropePricesSection({
  prices,
  ratesDate,
}: {
  prices: EuropePrice[];
  ratesDate: string | null;
}) {
  if (prices.length < 2) return null;
  const summary = europeSummary(prices);

  return (
    <section className="space-y-4" aria-labelledby="prix-europe">
      <h2 id="prix-europe" className="text-2xl font-semibold tracking-tight">
        Prix en Europe
      </h2>
      {summary && <p className="max-w-3xl leading-relaxed">{summary}</p>}

      <div className="rounded-xl border p-2">
        <EuropeMap
          data={prices
            .filter((p) => p.deltaPercent !== null)
            .map((p) => ({
              isoNumeric: p.isoNumeric,
              name: p.name,
              deltaPercent: p.deltaPercent ?? 0,
              label: `${localPrice(p.localCents, p.currency)} · ${formatPrice(p.eurCents)} (${delta(p)})`,
            }))}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pays</TableHead>
            <TableHead>Prix local</TableHead>
            <TableHead>En euros</TableHead>
            <TableHead>Écart avec la France</TableHead>
            <TableHead className="hidden sm:table-cell">Disponibilité</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prices.map((p) => (
            <TableRow key={p.country}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{localPrice(p.localCents, p.currency)}</TableCell>
              <TableCell>{formatPrice(p.eurCents)}</TableCell>
              <TableCell
                className={
                  p.deltaPercent && p.country !== "FR"
                    ? p.deltaPercent < 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                    : undefined
                }
              >
                {delta(p)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {AVAILABILITY_LABELS[p.availability]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-sm text-muted-foreground">
        Prix catalogue officiels des sites nationaux de la marque, relevés chaque semaine
        {ratesDate && `, convertis au taux de référence de la BCE du ${formatDate(ratesDate)}`}. Les
        prix étrangers incluent la TVA du pays : achat et garantie se font sur place.
      </p>
    </section>
  );
}
