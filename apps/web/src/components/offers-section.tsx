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
import { format } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { type CurrentOffer } from "@/lib/catalog/price-history";

/**
 * Offres relevées chez la marque et les revendeurs (cahier des charges, lot 3 : « prix neuf
 * réel, stock »). Liens sans affiliation, en nofollow : nous ne vendons rien et ne touchons rien.
 */
export async function OffersSection({ offers }: { offers: CurrentOffer[] }) {
  if (offers.length === 0) return null;
  const sellers = offers.length;
  const { dict, f } = await getDictionary();
  const t = dict.sections.offers;

  return (
    <section className="space-y-4" aria-labelledby="offres">
      <h2 id="offres" className="text-2xl font-semibold tracking-tight">
        {t.title}
      </h2>
      <p className="text-muted-foreground">
        {sellers > 1 ? format(t.many, { count: sellers }) : t.one}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.seller}</TableHead>
            <TableHead>{t.price}</TableHead>
            <TableHead>{t.availability}</TableHead>
            <TableHead className="hidden sm:table-cell">{t.lastChange}</TableHead>
            <TableHead>
              <span className="sr-only">{t.link}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((o) => (
            <TableRow key={o.source}>
              <TableCell className="font-medium">{o.label}</TableCell>
              <TableCell>{f.price(o.priceCents)}</TableCell>
              <TableCell>
                <Badge variant={o.availability === "in_stock" ? "default" : "outline"}>
                  {dict.availability[o.availability]}
                </Badge>
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {f.date(o.date)}
              </TableCell>
              <TableCell className="text-right">
                {o.url && (
                  <a
                    href={o.url}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="inline-flex items-center gap-1 underline underline-offset-4"
                  >
                    {t.seeOffer}
                    <ExternalLink className="size-3.5" aria-hidden />
                    <span className="sr-only">{format(t.at, { seller: o.label })}</span>
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
