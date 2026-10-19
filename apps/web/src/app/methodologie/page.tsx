import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { formatDate } from "@/lib/catalog/format";
import { getBrands, getLastRuns } from "@/lib/catalog/queries";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Méthodologie : d'où viennent nos prix et nos données",
  description:
    "Comment Aiguille relève les prix et les caractéristiques des montres : sources officielles, fréquence, règles de collecte et limites connues.",
  path: "/methodologie",
});

export default async function MethodologyPage() {
  const [brands, runs] = await Promise.all([getBrands(), getLastRuns()]);
  const covered = brands.filter((b) => b.watchCount > 0);

  return (
    <article className="max-w-3xl space-y-8">
      <Breadcrumbs crumbs={[{ name: "Méthodologie" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">Méthodologie</h1>
      <p className="text-lg text-muted-foreground">
        {siteConfig.name} publie uniquement des données relevées automatiquement à la source, et
        explique ici comment. Aucune donnée n&apos;est saisie à la main, achetée ou fournie par une
        marque.
      </p>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Sources</h2>
        <p>
          Les prix catalogue et les caractéristiques proviennent des sites officiels des marques,
          dans leur version française (prix en euros, TVA comprise).
        </p>
        <ul className="list-disc space-y-1 pl-6">
          {covered.map((b) => {
            const run = runs.find((r) => r.brandSlug === b.slug);
            return (
              <li key={b.slug}>
                <Link href={`/montres/${b.slug}`} className="underline underline-offset-4">
                  {b.name}
                </Link>{" "}
                : {b.watchCount} références suivies
                {run && `, dernier relevé le ${formatDate(run.finishedAt)}`}.
              </li>
            );
          })}
        </ul>
        <p>
          Prochaines sources : revendeurs français (prix réels et stock), annonces d&apos;occasion
          et marques Oris, Seiko et Citizen.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Comment les données sont relevées</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Chaque fiche produit est lue telle que la marque la publie, à partir des données
            structurées destinées aux moteurs de recherche et du tableau de caractéristiques.
          </li>
          <li>
            Toute fiche incomplète ou incohérente est rejetée plutôt que publiée approximativement.
          </li>
          <li>
            Un nouveau prix n&apos;est enregistré que s&apos;il change : l&apos;historique reflète
            les vraies variations, pas un relevé quotidien répété.
          </li>
          <li>
            Une référence qui disparaît du site de la marque reste en ligne, marquée « plus produite
            », pour les acheteurs d&apos;occasion.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Une collecte respectueuse</h2>
        <p>
          Notre robot s&apos;identifie (AiguilleBot), respecte les fichiers robots.txt,
          n&apos;envoie qu&apos;une requête à la fois avec au moins quatre secondes
          d&apos;intervalle, et ne reproduit jamais de texte d&apos;avis ou de description rédigé
          par un tiers. Les photos restent hébergées par les marques et sont créditées.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Limites connues</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Le prix catalogue est le prix public conseillé : les revendeurs peuvent pratiquer
            d&apos;autres prix (leur suivi arrive prochainement).
          </li>
          <li>
            Les caractéristiques sont celles publiées par la marque ; une erreur de sa part se
            retrouve ici.
          </li>
          <li>
            L&apos;historique des prix commence à la date de nos premiers relevés (octobre 2026).
          </li>
          <li>
            La note sur 100 de chaque montre sera publiée avec sa méthode de calcul détaillée dès
            que les données (prix dans le temps, avis) seront suffisantes pour être fiables.
          </li>
        </ul>
      </section>
    </article>
  );
}
