import Link from "next/link";

import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8 text-sm text-muted-foreground">
        <nav aria-label="Liens du site" className="flex flex-wrap gap-4">
          <Link href="/montres" className="hover:text-foreground">
            Toutes les montres
          </Link>
          <Link href="/nouveautes" className="hover:text-foreground">
            Nouveautés
          </Link>
          <Link href="/boutiques" className="hover:text-foreground">
            Boutiques
          </Link>
          <Link href="/prix-en-europe" className="hover:text-foreground">
            Prix en Europe
          </Link>
          <Link href="/methodologie" className="hover:text-foreground">
            Méthodologie
          </Link>
          <Link href="/a-propos" className="hover:text-foreground">
            À propos
          </Link>
        </nav>
        <p>
          {siteConfig.name} est un site gratuit, indépendant et sans publicité : aucune affiliation
          avec les marques ni les revendeurs.
        </p>
        <p>
          Prix et caractéristiques relevés automatiquement sur les sites officiels des marques.
          Photos : © les marques respectives, affichées depuis leurs sites.
        </p>
      </div>
    </footer>
  );
}
