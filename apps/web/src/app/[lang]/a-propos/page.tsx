import { Link } from "@/lib/i18n/client";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

export const metadata = pageMetadata({
  title: "À propos : un comparateur de montres indépendant",
  description:
    "Aiguille est un projet personnel, gratuit et non commercial : ni publicité, ni affiliation, ni vente. Pourquoi ce site existe et comment nous contacter.",
  path: "/a-propos",
});

export default function AboutPage() {
  return (
    <article className="max-w-3xl space-y-8">
      <Breadcrumbs crumbs={[{ name: "À propos" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">À propos d&apos;{siteConfig.name}</h1>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Pourquoi ce site</h2>
        <p>
          Choisir une montre de milieu de gamme demande de comparer des centaines de références,
          dont les prix changent et dont les avis sont dispersés. {siteConfig.name} rassemble les
          données utiles au même endroit : prix, caractéristiques, disponibilité, et bientôt
          l&apos;historique des prix et une note explicable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Indépendant et non commercial</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Aucune publicité, aucun lien d&apos;affiliation, aucune vente.</li>
          <li>Aucun lien commercial avec les marques ou les revendeurs cités.</li>
          <li>
            Les liens vers les sites des marques sont fournis pour vérifier nos données, sans
            rémunération.
          </li>
        </ul>
        <p>
          Les données et leur mode de collecte sont détaillés dans la{" "}
          <Link href="/methodologie" className="underline underline-offset-4">
            méthodologie
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Contact</h2>
        <p>
          Une erreur, une question, ou une marque qui souhaite le retrait d&apos;un visuel ? Ouvrez
          un ticket sur{" "}
          <a
            href={`${siteConfig.repository}/issues`}
            className="underline underline-offset-4"
            rel="noopener noreferrer"
          >
            le dépôt GitHub du projet
          </a>
          . Les demandes de retrait sont traitées sans délai.
        </p>
      </section>
    </article>
  );
}
