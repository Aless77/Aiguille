import { Watch } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { features } from "@/lib/features";
import { getBrands } from "@/lib/catalog/queries";
import { siteConfig } from "@/lib/site";

export async function SiteHeader() {
  const brands = (await getBrands()).filter((b) => b.watchCount > 0);

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Watch className="size-5" aria-hidden />
          {siteConfig.name}
        </Link>
        <nav aria-label="Navigation principale" className="flex items-center gap-4 text-sm">
          <Link
            href="/montres"
            className="whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            Toutes les montres
          </Link>
          <Link
            href="/nouveautes"
            className="whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            Nouveautés
          </Link>
          {features.community() && (
            <Link
              href="/communaute"
              className="hidden whitespace-nowrap text-muted-foreground hover:text-foreground md:inline"
            >
              Communauté
            </Link>
          )}
          <Link
            href="/boutiques"
            className="hidden whitespace-nowrap text-muted-foreground hover:text-foreground md:inline"
          >
            Boutiques
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
