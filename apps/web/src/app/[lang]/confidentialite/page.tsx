import { Link } from "@/lib/i18n/client";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Confidentialité : données personnelles et cookies",
  description: `Quelles données ${siteConfig.name} conserve sur les comptes, pourquoi, combien de temps, et comment supprimer votre compte. Aucun traceur publicitaire.`,
  path: "/confidentialite",
});

const sectionClass = "space-y-3";
const titleClass = "text-2xl font-semibold tracking-tight";
const linkClass = "underline underline-offset-4";

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl space-y-8">
      <Breadcrumbs crumbs={[{ name: "Confidentialité" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">Règles de confidentialité</h1>
      <p className="text-muted-foreground">Dernière mise à jour : 21 octobre 2026.</p>

      <section className={sectionClass}>
        <h2 className={titleClass}>En bref</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Consulter le site ne demande aucun compte et ne dépose aucun traceur.</li>
          <li>
            Un compte sert uniquement à donner votre avis sur les montres et à tenir vos listes de
            souhaits.
          </li>
          <li>Nous ne vendons, ne louons ni ne partageons aucune donnée. Aucune publicité.</li>
          <li>Vous pouvez supprimer votre compte vous-même, à tout moment.</li>
        </ul>
      </section>

      <section className={sectionClass}>
        <h2 className={titleClass}>Données conservées pour un compte</h2>
        <p>
          La connexion passe par GitHub ou Google : nous ne voyons ni ne stockons jamais votre mot
          de passe. Le service choisi nous transmet, avec votre accord :
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>votre nom (ou pseudonyme) et votre photo de profil ;</li>
          <li>
            votre adresse e-mail, pour reconnaître votre compte d&apos;une visite à l&apos;autre ;
          </li>
          <li>un identifiant technique de votre compte chez ce service.</li>
        </ul>
        <p>
          Après la création du compte, nous vous demandons votre pays de provenance (facultatif, «
          Ne pas préciser » possible, modifiable sur la page Mon compte). Seul le pays est
          enregistré, jamais d&apos;adresse : il sert uniquement à compter les visiteurs par pays.
        </p>
        <p>
          Pour chaque session ouverte, nous enregistrons aussi l&apos;adresse IP et le type de
          navigateur, afin de détecter les abus (faux avis, comptes multiples). Vos avis (notes,
          commentaire, propriétaire ou non) sont rattachés à votre compte et affichés publiquement
          avec votre nom et votre photo de profil, sur la fiche de la montre.
        </p>
        <p>
          Vos listes de souhaits (nom, description, montres choisies) sont privées par défaut. Si
          vous choisissez de les partager par lien ou de les publier dans la communauté, elles
          deviennent visibles avec votre nom et votre photo de profil, comme les messages que vous
          laissez sur les listes des autres membres. Vous pouvez aussi publier une liste ou écrire
          anonymement : les autres membres voient alors « Auteur de la liste » ou un pseudonyme
          propre à chaque liste (par exemple « Balancier ambre 27 »), jamais votre nom ni votre
          photo, et ne peuvent pas relier vos messages d&apos;une liste à l&apos;autre. Le message
          reste rattaché à votre compte côté site, pour lutter contre les abus.
        </p>
        <p>
          Nous n&apos;envoyons aucun e-mail et ne demandons aucun accès à vos dépôts GitHub ni à vos
          données Google au-delà de votre profil.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={titleClass}>Pourquoi et sur quelle base</h2>
        <p>
          Ces données servent uniquement à faire fonctionner votre compte et à garantir un seul avis
          par personne et par montre. Base légale : l&apos;exécution du service que vous demandez en
          créant un compte (article 6.1.b du RGPD) et notre intérêt légitime à lutter contre les
          abus (article 6.1.f).
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={titleClass}>Durée de conservation</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Session : 30 jours au plus, effacée à la déconnexion.</li>
          <li>Compte : tant que vous ne le supprimez pas.</li>
          <li>
            À la suppression du compte, vos données de profil, vos sessions, vos avis, vos listes et
            vos commentaires sont effacés immédiatement. Vous pouvez aussi supprimer un seul avis
            depuis la fiche, une liste depuis « Mes listes » et un commentaire depuis la liste.
          </li>
        </ul>
      </section>

      <section className={sectionClass}>
        <h2 className={titleClass}>Cookies</h2>
        <p>Deux cookies au plus, tous deux nécessaires au service que vous demandez :</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>le cookie de session, déposé uniquement quand vous vous connectez ;</li>
          <li>
            le cookie « theme », déposé uniquement si vous choisissez le thème sombre ou clair, pour
            retenir ce choix pendant un an. Il ne contient que ce choix et n&apos;est jamais lu par
            nos serveurs.
          </li>
        </ul>
        <p>
          Aucun cookie publicitaire, aucune mesure d&apos;audience, aucun bouton de réseau social :
          aucun bandeau de consentement n&apos;est donc nécessaire.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={titleClass}>Hébergement</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Site : Vercel Inc. (États-Unis), qui sert les pages et traite les requêtes.</li>
          <li>Base de données : Neon, hébergée dans l&apos;Union européenne (Francfort).</li>
          <li>Nom de domaine : Cloudflare.</li>
        </ul>
        <p>
          Les transferts hors de l&apos;Union européenne vers Vercel sont encadrés par le cadre de
          protection des données UE-États-Unis et les clauses contractuelles types de la Commission
          européenne.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={titleClass}>Vos droits</h2>
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de
          portabilité et d&apos;opposition. Le plus simple : depuis la page{" "}
          <Link href="/compte" className={linkClass}>
            Mon compte
          </Link>
          , vous voyez les données conservées et pouvez supprimer votre compte en un clic. Pour
          toute autre demande, ouvrez un ticket sur{" "}
          <a
            href={`${siteConfig.repository}/issues`}
            className={linkClass}
            rel="noopener noreferrer"
          >
            le dépôt GitHub du projet
          </a>{" "}
          sans y indiquer de donnée personnelle : nous vous répondrons pour vérifier votre identité.
        </p>
        <p>
          Vous pouvez aussi adresser une réclamation à la{" "}
          <a href="https://www.cnil.fr/fr/plaintes" className={linkClass} rel="noopener noreferrer">
            CNIL
          </a>
          .
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={titleClass}>Responsable</h2>
        <p>
          {siteConfig.name} est un projet personnel, gratuit et non commercial, édité par une
          personne physique. Voir{" "}
          <Link href="/a-propos" className={linkClass}>
            À propos
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
