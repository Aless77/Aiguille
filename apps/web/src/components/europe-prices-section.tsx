import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COUNTRY_INFO, type EuropePrice, europeSummary } from "@/lib/catalog/europe-prices";
import { format } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";

import { EuropeMap } from "./europe-map";

/**
 * Prix officiels de la montre dans les pays européens couverts, convertis en euros (lot 4).
 * Résumé et tableau dans le HTML serveur ; la carte n'est qu'une aide visuelle.
 */
export async function EuropePricesSection({
  prices,
  ratesDate,
}: {
  prices: EuropePrice[];
  ratesDate: string | null;
}) {
  if (prices.length < 2) return null;
  const { dict, f, locale } = await getDictionary();
  const t = dict.sections.europe;
  const localPrice = (cents: number, currency: string) =>
    new Intl.NumberFormat(f.tag, { style: "currency", currency, maximumFractionDigits: 0 })
      .format(cents / 100)
      .replace(/ /g, " ");
  const delta = (p: EuropePrice) =>
    p.deltaPercent === null || p.country === "FR"
      ? "—"
      : `${p.deltaPercent > 0 ? "+" : ""}${f.number(p.deltaPercent)} %`;
  const summary = europeSummary(prices, {
    franceCheapest: t.franceCheapest,
    cheaper: t.cheaper,
    // En français, la préposition suit le pays (« au Royaume-Uni ») ; ailleurs, le nom seul.
    inCountry: (code) => (locale === "fr" ? (COUNTRY_INFO[code]?.inName ?? code) : f.country(code)),
    number: (n) => f.number(n),
  });

  return (
    <section className="space-y-4" aria-labelledby="prix-europe">
      <h2 id="prix-europe" className="text-2xl font-semibold tracking-tight">
        {t.title}
      </h2>
      {summary && <p className="max-w-3xl leading-relaxed">{summary}</p>}

      <div className="rounded-xl border p-2">
        <EuropeMap
          data={prices
            .filter((p) => p.deltaPercent !== null)
            .map((p) => ({
              isoNumeric: p.isoNumeric,
              name: f.country(p.country),
              deltaPercent: p.deltaPercent ?? 0,
              label: `${localPrice(p.localCents, p.currency)} · ${f.price(p.eurCents)} (${delta(p)})`,
            }))}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.country}</TableHead>
            <TableHead>{t.localPrice}</TableHead>
            <TableHead>{t.inEuros}</TableHead>
            <TableHead>{t.gap}</TableHead>
            <TableHead className="hidden sm:table-cell">{t.availability}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prices.map((p) => (
            <TableRow key={p.country}>
              <TableCell className="font-medium">{f.country(p.country)}</TableCell>
              <TableCell>{localPrice(p.localCents, p.currency)}</TableCell>
              <TableCell>{f.price(p.eurCents)}</TableCell>
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
                {dict.availability[p.availability]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-sm text-muted-foreground">
        {format(t.footer, {
          rates: ratesDate ? format(t.rates, { date: f.date(ratesDate) }) : "",
        })}
      </p>
    </section>
  );
}
