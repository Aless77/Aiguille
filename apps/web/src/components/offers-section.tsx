import { ExternalLink } from "lucide-react";

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
import { AVAILABILITY_LABELS, type CurrentOffer } from "@/lib/catalog/price-history";

/**
 * Offres relevées chez la marque et les revendeurs (cahier des charges, lot 3 : « prix neuf
 * réel, stock »). Liens sans affiliation, en nofollow : nous ne vendons rien et ne touchons rien.
 */
export function OffersSection({ offers }: { offers: CurrentOffer[] }) {
  if (offers.length === 0) return null;
  const sellers = offers.length;

  return (
    <section className="space-y-4" aria-labelledby="offres">
      <h2 id="offres" className="text-2xl font-semibold tracking-tight">
        Où la trouver
      </h2>
      <p className="text-muted-foreground">
        {sellers > 1
          ? `${sellers} vendeurs suivis proposent cette montre. Les liens ne sont pas affiliés.`
          : "Un vendeur suivi propose cette montre. Le lien n'est pas affilié."}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendeur</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Disponibilité</TableHead>
            <TableHead className="hidden sm:table-cell">Dernier changement</TableHead>
            <TableHead>
              <span className="sr-only">Lien</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((o) => (
            <TableRow key={o.source}>
              <TableCell className="font-medium">{o.label}</TableCell>
              <TableCell>{formatPrice(o.priceCents)}</TableCell>
              <TableCell>
                <Badge variant={o.availability === "in_stock" ? "default" : "outline"}>
                  {AVAILABILITY_LABELS[o.availability]}
                </Badge>
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {formatDate(o.date)}
              </TableCell>
              <TableCell className="text-right">
                {o.url && (
                  <a
                    href={o.url}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="inline-flex items-center gap-1 underline underline-offset-4"
                  >
                    Voir l&apos;offre
                    <ExternalLink className="size-3.5" aria-hidden />
                    <span className="sr-only">chez {o.label}</span>
                  </a>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
