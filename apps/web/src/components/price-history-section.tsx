import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type PriceHistory } from "@/lib/catalog/price-history";
import { getDictionary } from "@/lib/i18n/server";

import { PriceChart } from "./price-chart";

/** Texte avec un montant mis en gras : « Prix stable à **1 250 €** depuis… ». */
function withBold(text: string, values: Record<string, string>) {
  return text.split(/(\{\w+\})/).map((part, i) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    if (!key || !(key in values)) return part;
    return ["price", "lowest", "highest"].includes(key) ? (
      <strong key={i}>{values[key]}</strong>
    ) : (
      values[key]
    );
  });
}

/**
 * Historique des prix d'une fiche : résumé en texte (rendu serveur, lu par les moteurs), courbe
 * (client) et tableau des changements. Cahier des charges, lot 3 : « courbe par revendeur, plus
 * bas / plus haut ».
 */
export async function PriceHistorySection({ history }: { history: PriceHistory }) {
  if (!history.since) return null;
  const { dict, f } = await getDictionary();
  const t = dict.sections.history;
  const { lowest, highest, current } = history;
  const stable = lowest && highest && lowest.priceCents === highest.priceCents;
  const changes = history.changes.slice(0, 12);
  // Une courbe sur quelques jours n'apprend rien : on l'affiche à partir d'une semaine de relevés.
  const lastDate = history.series
    .flatMap((s) => s.points.map((p) => p.date))
    .sort()
    .at(-1);
  const spanDays = lastDate
    ? (new Date(lastDate).getTime() - new Date(history.since).getTime()) / 86_400_000
    : 0;
  const price = (cents: number | null | undefined) => f.price(cents) ?? "—";

  return (
    <section className="space-y-4" aria-labelledby="historique-prix">
      <h2 id="historique-prix" className="text-2xl font-semibold tracking-tight">
        {t.title}
      </h2>

      <p className="max-w-3xl leading-relaxed">
        {stable ? (
          withBold(t.stable, { price: price(lowest.priceCents), date: f.date(history.since) })
        ) : (
          <>
            {withBold(t.since, { date: f.date(history.since), lowest: price(lowest?.priceCents) })}
            {lowest && t.on.replace("{date}", f.date(lowest.date))}
            {withBold(t.andHighest, { highest: price(highest?.priceCents) })}
            {highest && t.on.replace("{date}", f.date(highest.date))}.
          </>
        )}{" "}
        {current &&
          current.priceCents !== null &&
          !stable &&
          t.current.replace("{price}", price(current.priceCents))}
      </p>

      {spanDays >= 7 ? (
        <div className="rounded-xl border p-4">
          <PriceChart series={history.series} />
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          {t.chartSoon}
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.date}</TableHead>
            <TableHead>{t.source}</TableHead>
            <TableHead>{t.price}</TableHead>
            <TableHead>{t.availability}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changes.map((c) => (
            <TableRow key={`${c.source}-${c.date}-${c.priceCents}-${c.availability}`}>
              <TableCell>{f.date(c.date)}</TableCell>
              <TableCell>{c.label}</TableCell>
              <TableCell>{price(c.priceCents)}</TableCell>
              <TableCell>
                <Badge variant="outline">{dict.availability[c.availability]}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-sm text-muted-foreground">{t.note}</p>
    </section>
  );
}
