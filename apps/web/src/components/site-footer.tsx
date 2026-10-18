import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto w-full max-w-6xl space-y-2 px-4 py-8 text-sm text-muted-foreground">
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
