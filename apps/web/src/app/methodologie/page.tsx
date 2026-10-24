import { FAMILIES, PRICE_BANDS } from "@aiguille/db/facts";
import {
  BAYES_PRIOR_WEIGHT,
  DEFAULT_PRIOR_MEAN,
  MIN_PEERS,
  PILLAR_WEIGHTS,
} from "@aiguille/db/rating";
import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { formatDate } from "@/lib/catalog/format";
import { getBrands, getLastRuns } from "@/lib/catalog/queries";
import { pageMetadata } from "@/lib/seo/metadata";
import { features } from "@/lib/features";
import { siteConfig } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Méthodologie : d'où viennent nos prix et nos données",
  description:
    "Comment Aiguille relève les prix et les caractéristiques des montres et les compare : sources, fréquence, garantie, entretien, règles de collecte et limites.",
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
          Prix réels et stock : revendeurs Lepage et Ocarat. Prochaines sources : annonces
          d&apos;occasion et marques Oris, Seiko et Citizen.
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

      <section id="technique" className="scroll-mt-20 space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Technique, garantie et entretien</h2>
        <p>
          Nous ne disons pas si une montre est « bonne » : le design, la finition ou le plaisir au
          poignet sont subjectifs. Nous présentons ce qui se vérifie, tel que chaque marque le
          publie sur sa fiche officielle : mouvement (type, calibre, réserve de marche, fréquence,
          spiral, certification chronomètre, fonctions), construction (verre, étanchéité, boîtier,
          lunette, fond, couronne, luminescence, bracelet), garantie, pays de fabrication, pile des
          montres à quartz et nombre de points de vente agréés.
        </p>
        <p>
          Quand une marque ne publie pas une information, la fiche l&apos;indique : « non communiqué
          par la marque ». Les informations qui ne figurent pas sur les fiches (garantie standard,
          fabricant d&apos;un mouvement) ne sont affichées que si une page publique de la marque les
          établit ; nous gardons sa référence et la date de vérification. Les tarifs et délais de
          révision ne sont publiés par aucune des marques suivies.
        </p>
        <h3 className="text-lg font-semibold">Aussi bien équipées, pour moins cher</h3>
        <p>
          Sous chaque fiche, nous proposons jusqu&apos;à trois montres du même usage (plongée,
          habillée, chronographe…), de diamètre proche (3 mm d&apos;écart au plus) et au moins 10 %
          moins chères, qui font <strong>au moins aussi bien sur chaque point technique</strong>{" "}
          publié : type de mouvement, réserve de marche, verre saphir, étanchéité, spiral,
          certification, fonctions, garantie, lunette céramique et couronne vissée, matière noble.
          Une donnée connue pour la montre regardée doit l&apos;être aussi pour l&apos;alternative :
          nous ne promettons rien sans preuve. Les pièces vintage ne sont ni comparées ni proposées.
        </p>
      </section>

      {features.score() && (
        <section id="note" className="scroll-mt-20 space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Note Aiguille et avis</h2>
          <p>
            Chaque fiche affiche deux évaluations distinctes, jamais mélangées : la{" "}
            <strong>Note Aiguille</strong> sur 100, notre évaluation fondée sur les faits, et
            l&apos;
            <strong>avis de la communauté</strong> sur 5, ce qu&apos;en pensent ceux qui la portent.
          </p>

          <h3 className="text-lg font-semibold">Toujours dans son registre</h3>
          <p>
            Comparer une montre à 400 € et une montre à 15 000 € n&apos;aurait aucun sens. La Note
            Aiguille juge chaque montre <strong>parmi les montres comparables</strong> : même gamme
            de prix ({PRICE_BANDS.map((b) => b.label.toLowerCase()).join(", ")}) et même usage (
            {Object.values(FAMILIES).join(", ")}). Une excellente montre d&apos;entrée de gamme peut
            donc obtenir 90/100. Quand une catégorie compte moins de {MIN_PEERS} montres, la
            comparaison s&apos;étend aux gammes voisines, puis à toutes les familles de la gamme :
            la fiche indique toujours à quelles montres elle est comparée, et son rang.
          </p>

          <h3 className="text-lg font-semibold">Les trois piliers de la Note Aiguille</h3>
          <p>
            Chaque pilier combine un barème (25 %) et le rang de la montre dans sa catégorie (75 %).
            Les faits viennent des fiches officielles des marques : une donnée que la marque ne
            publie pas compte pour une valeur moyenne, sans pénaliser ni avantager la montre.
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Mouvement ({PILLAR_WEIGHTS.movement} %)</strong> : type (mécanique ou quartz),
              réserve de marche, fréquence, spiral en silicium ou antimagnétique, certification
              chronomètre (COSC) et complications (chronographe, second fuseau, phases de lune,
              calendriers…).
            </li>
            <li>
              <strong>Construction ({PILLAR_WEIGHTS.construction} %)</strong> : verre saphir et
              antireflet, étanchéité <strong>attendue pour son usage</strong> (une montre de plongée
              doit descendre à 200 m, pas une montre habillée), matière du boîtier, fond
              transparent, couronne vissée, luminescence.
            </li>
            <li>
              <strong>Rapport qualité-prix ({PILLAR_WEIGHTS.value} %)</strong> : équipement
              (mouvement et construction) face au prix parmi les montres comparables, remise chez
              les revendeurs et disponibilité.
            </li>
          </ul>
          <p>
            La confiance de la Note Aiguille dépend de la fiche de la marque (calibre, réserve de
            marche, verre, étanchéité, matière) et du nombre de montres comparables. La note est
            recalculée chaque nuit après le relevé des prix.
          </p>

          <h3 className="text-lg font-semibold">Ce que la Note Aiguille ne juge pas</h3>
          <p>
            Le design, la finition réelle, le confort au poignet ou l&apos;histoire d&apos;un modèle
            ne se mesurent pas sur une fiche technique : nous ne les notons pas nous-mêmes. Ils sont
            l&apos;affaire de l&apos;avis de la communauté. La rareté (édition limitée, modèle plus
            produit) est signalée, sans bonus : rare ne veut pas dire meilleure.
          </p>
        </section>
      )}

      {features.reviews() && (
        <section id="avis" className="scroll-mt-20 space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">L&apos;avis de la communauté</h2>
          <p>
            Les visiteurs connectés notent de 1 à 5 la finition, le design, le confort, la
            lisibilité, la précision et le rapport qualité-prix,{" "}
            <strong>par rapport à ce qu&apos;on peut attendre à son prix</strong>, avec un seul avis
            par personne et par montre. La fiche affiche la moyenne brute et le nombre d&apos;avis :
            c&apos;est l&apos;opinion de ceux qui la portent, pas la nôtre. Pour classer les
            montres, la moyenne est <strong>bayésienne</strong> : elle part de {DEFAULT_PRIOR_MEAN}
            /5 comme si la montre avait déjà {BAYES_PRIOR_WEIGHT} avis moyens, pour qu&apos;un avis
            isolé à 5/5 ne passe pas devant cent avis à 4,6/5.
          </p>
          <p>
            Les notes publiées par d&apos;autres sites spécialisés rejoindront cet avis, sous forme
            de note agrégée et de lien vers leur source, sans jamais reproduire leur texte.
          </p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Limites connues</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Le prix catalogue est le prix public conseillé : chaque revendeur peut pratiquer
            d&apos;autres prix, et nous n&apos;en suivons que deux pour l&apos;instant.
          </li>
          <li>
            Les caractéristiques sont celles publiées par la marque ; une erreur de sa part se
            retrouve ici.
          </li>
          <li>
            L&apos;historique des prix commence à la date de nos premiers relevés (octobre 2026).
          </li>
          <li>
            Les informations techniques dépendent de ce que chaque marque publie : une marque qui
            détaille moins ses mouvements (fréquence, spiral, fabricant) apparaît avec plus de « non
            communiqué ». Les familles d&apos;usage sont déduites des noms et des caractéristiques
            et peuvent se tromper sur quelques modèles.
          </li>
        </ul>
      </section>
    </article>
  );
}
