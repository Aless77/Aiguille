import { Breadcrumbs } from "@/components/breadcrumbs";
import { MyLists } from "@/components/my-lists";
import { Link } from "@/lib/i18n/client";
import { getDictionary } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/seo/localized-metadata";

export async function generateMetadata() {
  const t = (await getDictionary()).dict.community.lists;
  return localizedMetadata({
    title: t.myListsTitle,
    description: t.myListsMetaDescription,
    path: "/listes",
    index: false,
  });
}

export default async function MyListsPage() {
  const t = (await getDictionary()).dict.community.lists;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs crumbs={[{ name: t.myLists }]} />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t.myListsTitle}</h1>
        <p className="text-muted-foreground">
          {t.myListsIntro}{" "}
          <Link href="/communaute" className="underline underline-offset-4">
            {t.community}
          </Link>{" "}
          {t.myListsIntroEnd}
        </p>
      </div>
      <MyLists />
    </div>
  );
}
