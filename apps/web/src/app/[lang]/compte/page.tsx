import { AccountPanel } from "@/components/account-panel";
import { Link } from "@/lib/i18n/client";
import { getDictionary } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/seo/localized-metadata";

export async function generateMetadata() {
  const t = (await getDictionary()).dict.community.account;
  return localizedMetadata({
    title: t.metaTitle,
    description: t.metaDescription,
    path: "/compte",
    index: false,
  });
}

export default async function AccountPage() {
  const t = (await getDictionary()).dict.community.account;
  return (
    <div className="mx-auto max-w-xl space-y-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
      <AccountPanel />
      <p className="text-sm text-muted-foreground">
        {t.privacyIntro}{" "}
        <Link href="/confidentialite" className="underline underline-offset-4">
          {t.privacy}
        </Link>
        .
      </p>
    </div>
  );
}
