import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatPrice } from "@/lib/catalog/format";
import { AVAILABILITY_LABELS, type PriceHistory } from "@/lib/catalog/price-history";

import { PriceChart } from "./price-chart";

/**
 * Historique des prix d'une fiche : résumé en texte (rendu serveur, lu par les moteurs), courbe
 * (client) et tableau des changements. Cahier des charges, lot 3 : « courbe par revendeur, plus
 * bas / plus haut ».
 */
export function PriceHistorySection({ history }: { history: PriceHistory }) {
  if (!history.since) return null;
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

  return (
    <section className="space-y-4" aria-labelledby="historique-prix">
      <h2 id="historique-prix" className="text-2xl font-semibold tracking-tight">
        Historique des prix
      </h2>

      <p className="max-w-3xl leading-relaxed">
        {stable ? (
          <>
            Prix stable à <strong>{formatPrice(lowest.priceCents)}</strong> depuis notre premier
            relevé du {formatDate(history.since)}.
          </>
        ) : (
          <>
            Depuis le {formatDate(history.since)}, le prix le plus bas relevé est{" "}
            <strong>{formatPrice(lowest?.priceCents)}</strong>
            {lowest && ` (le ${formatDate(lowest.date)})`} et le plus haut{" "}
            <strong>{formatPrice(highest?.priceCents)}</strong>
            {highest && ` (le ${formatDate(highest.date)})`}.
          </>
        )}{" "}
        {current && current.priceCents !== null && !stable && (
          <>Prix actuel : {formatPrice(current.priceCents)}.</>
        )}
      </p>

      {spanDays >= 7 ? (
        <div className="rounded-xl border p-4">
          <PriceChart series={history.series} />
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          La courbe des prix s&apos;affichera après une semaine de relevés quotidiens.
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Disponibilité</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changes.map((c) => (
            <TableRow key={`${c.source}-${c.date}-${c.priceCents}-${c.availability}`}>
              <TableCell>{formatDate(c.date)}</TableCell>
              <TableCell>{c.label}</TableCell>
              <TableCell>{formatPrice(c.priceCents) ?? "—"}</TableCell>
              <TableCell>
                <Badge variant="outline">{AVAILABILITY_LABELS[c.availability]}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-sm text-muted-foreground">
        Une ligne n&apos;est ajoutée que lorsque le prix ou la disponibilité change.
      </p>
    </section>
  );
}
