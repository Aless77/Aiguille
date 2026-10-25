import { Link } from "@/lib/i18n/client";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { format } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/seo/localized-metadata";
import { siteConfig } from "@/lib/site";

export async function generateMetadata() {
  const { dict } = await getDictionary();
  return localizedMetadata({
    title: dict.pages.about.metaTitle,
    description: dict.pages.about.metaDescription,
    path: "/a-propos",
  });
}

export default async function AboutPage() {
  const { dict } = await getDictionary();
  const t = dict.pages.about;
  return (
    <article className="max-w-3xl space-y-8">
      <Breadcrumbs crumbs={[{ name: t.breadcrumb }]} />
      <h1 className="text-3xl font-semibold tracking-tight">
        {format(t.title, { site: siteConfig.name })}
      </h1>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">{t.whyTitle}</h2>
        <p>{format(t.why, { site: siteConfig.name })}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">{t.independenceTitle}</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>{t.noAds}</li>
          <li>{t.noBusiness}</li>
          <li>{t.links}</li>
        </ul>
        <p>
          {t.methodIntro}{" "}
          <Link href="/methodologie" className="underline underline-offset-4">
            {t.method}
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">{t.contactTitle}</h2>
        <p>
          {t.contactIntro}{" "}
          <a
            href={`${siteConfig.repository}/issues`}
            className="underline underline-offset-4"
            rel="noopener noreferrer"
          >
            {t.repository}
          </a>
          . {t.contactEnd}
        </p>
      </section>
    </article>
  );
}
