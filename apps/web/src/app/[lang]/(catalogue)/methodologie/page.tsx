import { FAMILIES, PRICE_BANDS } from "@aiguille/db/facts";
import {
  BAYES_PRIOR_WEIGHT,
  DEFAULT_PRIOR_MEAN,
  MIN_PEERS,
  PILLAR_WEIGHTS,
} from "@aiguille/db/rating";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { getBrands, getLastRuns } from "@/lib/catalog/queries";
import { features } from "@/lib/features";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/seo/localized-metadata";
import { siteConfig } from "@/lib/site";

import { METHODOLOGY } from "./content";

export async function generateMetadata() {
  const content = METHODOLOGY[await getLocale()];
  return localizedMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: "/methodologie",
  });
}

export default async function MethodologyPage() {
  const [brands, runs, { locale, f }] = await Promise.all([
    getBrands(),
    getLastRuns(),
    getDictionary(),
  ]);
  const content = METHODOLOGY[locale];
  const covered = brands.filter((b) => b.watchCount > 0);

  return (
    <article className="max-w-3xl space-y-8">
      <Breadcrumbs crumbs={[{ name: content.title }]} />
      <h1 className="text-3xl font-semibold tracking-tight">{content.title}</h1>
      {content.body({
        site: siteConfig.name,
        brands: covered.map((b) => {
          const run = runs.find((r) => r.brandSlug === b.slug);
          return {
            slug: b.slug,
            name: b.name,
            count: f.number(b.watchCount, 0),
            lastRun: run ? f.date(run.finishedAt) : null,
          };
        }),
        showScore: features.score(),
        showReviews: features.reviews(),
        priceBands: PRICE_BANDS.map((b) => b.label.toLowerCase()).join(", "),
        families: Object.values(FAMILIES).join(", "),
        minPeers: MIN_PEERS,
        weights: PILLAR_WEIGHTS,
        priorMean: DEFAULT_PRIOR_MEAN,
        priorWeight: BAYES_PRIOR_WEIGHT,
      })}
    </article>
  );
}
