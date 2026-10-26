import { Breadcrumbs } from "@/components/breadcrumbs";
import { getLocale } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/seo/localized-metadata";
import { siteConfig } from "@/lib/site";

import { PRIVACY } from "./content";

export async function generateMetadata() {
  const content = PRIVACY[await getLocale()];
  return localizedMetadata({
    title: content.metaTitle(siteConfig.name),
    description: content.metaDescription(siteConfig.name),
    path: "/confidentialite",
  });
}

export default async function PrivacyPage() {
  const content = PRIVACY[await getLocale()];
  return (
    <article className="max-w-3xl space-y-8">
      <Breadcrumbs crumbs={[{ name: content.breadcrumb }]} />
      <h1 className="text-3xl font-semibold tracking-tight">{content.title}</h1>
      {content.body(siteConfig.name, siteConfig.repository)}
    </article>
  );
}
