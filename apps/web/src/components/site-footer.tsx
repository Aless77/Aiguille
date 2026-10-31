import { getBrands } from "@/lib/catalog/queries";
import { Link } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

/** Marques les mieux couvertes, reliées depuis chaque page ; la liste complète est sur /marques. */
const FOOTER_BRANDS = 12;

export async function SiteFooter() {
  const [brands, { dict }] = await Promise.all([getBrands(), getDictionary()]);
  const t = dict.footer;
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8 text-sm text-muted-foreground">
        <nav aria-label={t.label} className="flex flex-wrap gap-4">
          <Link href="/montres" className="hover:text-foreground">
            {dict.nav.allWatches}
          </Link>
          <Link href="/nouveautes" className="hover:text-foreground">
            {dict.nav.newArrivals}
          </Link>
          <Link href="/boutiques" className="hover:text-foreground">
            {dict.nav.stores}
          </Link>
          <Link href="/prix-en-europe" className="hover:text-foreground">
            {t.europePrices}
          </Link>
          <Link href="/methodologie" className="hover:text-foreground">
            {t.methodology}
          </Link>
          <Link href="/confidentialite" className="hover:text-foreground">
            {t.privacy}
          </Link>
          <Link href="/a-propos" className="hover:text-foreground">
            {t.about}
          </Link>
        </nav>
        <nav aria-label={dict.nav.brands} className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/marques" className="font-medium hover:text-foreground">
            {dict.nav.brands}
          </Link>
          {brands
            .filter((b) => b.watchCount > 0)
            .slice(0, FOOTER_BRANDS)
            .map((b) => (
              <Link key={b.slug} href={`/montres/${b.slug}`} className="hover:text-foreground">
                {b.name}
              </Link>
            ))}
        </nav>
        <p>{format(t.independent, { site: siteConfig.name })}</p>
        <p>{t.sources}</p>
      </div>
    </footer>
  );
}
