import { Watch } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { features } from "@/lib/features";
import { getBrands } from "@/lib/catalog/queries";
import { Link } from "@/lib/i18n/client";
import { enabledLocales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

export async function SiteHeader() {
  const brands = (await getBrands()).filter((b) => b.watchCount > 0);
  const { dict } = await getDictionary();
  const t = dict.nav;

  return (
    <header className="border-b">
      <div className="mx-auto flex min-h-14 w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 lg:flex-nowrap lg:py-0">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Watch className="size-5" aria-hidden />
          {siteConfig.name}
        </Link>
        <nav
          aria-label={t.label}
          className="order-3 flex w-full items-center gap-4 overflow-x-auto pb-1 text-sm lg:order-none lg:w-auto lg:overflow-visible lg:pb-0"
        >
          <Link
            href="/montres"
            className="whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            {t.allWatches}
          </Link>
          <Link
            href="/nouveautes"
            className="whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            {t.newArrivals}
          </Link>
          {features.community() && (
            <Link
              href="/communaute"
              className="hidden whitespace-nowrap text-muted-foreground hover:text-foreground md:inline"
            >
              {t.community}
            </Link>
          )}
          <Link
            href="/boutiques"
            className="hidden whitespace-nowrap text-muted-foreground hover:text-foreground md:inline"
          >
            {t.stores}
          </Link>
          {brands.map((b) => (
            <Link
              key={b.slug}
              href={`/montres/${b.slug}`}
              className="hidden whitespace-nowrap text-muted-foreground hover:text-foreground sm:inline"
            >
              {b.name}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitcher locales={enabledLocales()} label={dict.language.label} />
          <ThemeToggle />
          {/* Un compte sert aux avis et aux listes : lien masqué si les deux le sont. */}
          {(features.reviews() || features.community()) && (
            <UserMenu showLists={features.community()} />
          )}
        </div>
      </div>
    </header>
  );
}
