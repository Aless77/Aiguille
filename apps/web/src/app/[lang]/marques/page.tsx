import { BrandFavoriteButton } from "@/components/brand-favorite-button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { groupBrandsByLetter, LETTERS_FROM, sortBrands } from "@/lib/catalog/brand-directory";
import { getBrands, type BrandSummary } from "@/lib/catalog/queries";
import { Link } from "@/lib/i18n/client";
import { getDictionary } from "@/lib/i18n/server";
import { itemListJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { localizedMetadata } from "@/lib/seo/localized-metadata";

export async function generateMetadata() {
  const { dict } = await getDictionary();
  const t = dict.catalog.brandsIndex;
  return localizedMetadata({
    title: t.metaTitle,
    description: t.metaDescription,
    path: "/marques",
  });
}

export default async function BrandsPage() {
  const [all, { dict, f, locale, path }] = await Promise.all([getBrands(), getDictionary()]);
  const t = dict.catalog.brandsIndex;
  const brands = sortBrands(
    all.filter((b) => b.watchCount > 0),
    locale,
  );
  const sections = groupBrandsByLetter(brands);

  const grid = (group: BrandSummary[]) => (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {group.map((brand) => (
        <li
          key={brand.slug}
          className="flex items-center gap-2 rounded-xl border p-3 transition-colors hover:bg-muted/50"
        >
          <Link href={`/montres/${brand.slug}`} className="min-w-0 flex-1">
            <span className="block truncate font-medium">{brand.name}</span>
            <span className="block text-sm text-muted-foreground">
              {f.plural(dict.catalog.results.count, brand.watchCount)}
              {brand.minPriceCents !== null &&
                ` · ${f.price(brand.minPriceCents)} – ${f.price(brand.maxPriceCents)}`}
            </span>
          </Link>
          <BrandFavoriteButton brand={{ slug: brand.slug, name: brand.name }} />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Breadcrumbs crumbs={[{ name: t.title }]} />
        <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
        <p className="max-w-2xl text-muted-foreground">{t.intro}</p>
      </div>

      {brands.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-muted-foreground">{t.empty}</p>
      ) : brands.length < LETTERS_FROM ? (
        grid(brands)
      ) : (
        <>
          <nav aria-label={t.lettersLabel} className="flex flex-wrap gap-1">
            {sections.map(({ letter }) => (
              <a
                key={letter}
                href={`#lettre-${letter}`}
                className="flex size-8 items-center justify-center rounded-md border text-sm hover:bg-muted"
              >
                {letter}
              </a>
            ))}
          </nav>
          {sections.map(({ letter, brands: group }) => (
            <section key={letter} id={`lettre-${letter}`} className="scroll-mt-20 space-y-3">
              <h2 className="text-xl font-semibold tracking-tight">{letter}</h2>
              {grid(group)}
            </section>
          ))}
        </>
      )}

      {brands.length > 0 && (
        <JsonLd
          data={itemListJsonLd(
            brands.map((b) => ({ name: b.name, path: path(`/montres/${b.slug}`) })),
          )}
        />
      )}
    </div>
  );
}
