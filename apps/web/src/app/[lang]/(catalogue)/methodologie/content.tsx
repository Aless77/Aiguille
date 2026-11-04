import { type ReactNode } from "react";

import { Link } from "@/lib/i18n/client";
import { type Locale } from "@/lib/i18n/config";

/** Données affichées dans la méthodologie, identiques dans toutes les langues. */
export interface MethodologyData {
  site: string;
  brands: { slug: string; name: string; count: string; lastRun: string | null }[];
  showScore: boolean;
  showReviews: boolean;
  priceBands: string;
  families: string;
  minPeers: number;
  weights: { movement: number; construction: number; value: number };
  priorMean: number;
  priorWeight: number;
}

interface MethodologyContent {
  metaTitle: string;
  metaDescription: string;
  title: string;
  body: (d: MethodologyData) => ReactNode;
}

const link = "underline underline-offset-4";
const h2 = "text-2xl font-semibold tracking-tight";
const h3 = "text-lg font-semibold";
const list = "list-disc space-y-1 pl-6";

function BrandList({
  brands,
  references,
  separator,
  lastRun,
}: {
  brands: MethodologyData["brands"];
  references: (count: string) => string;
  separator: string;
  lastRun: (date: string) => string;
}) {
  return (
    <ul className={list}>
      {brands.map((b) => (
        <li key={b.slug}>
          <Link href={`/montres/${b.slug}`} className={link}>
            {b.name}
          </Link>
          {separator}
          {references(b.count)}
          {b.lastRun && lastRun(b.lastRun)}.
        </li>
      ))}
    </ul>
  );
}

const fr: MethodologyContent = {
  metaTitle: "Méthodologie : d'où viennent nos prix et nos données",
  metaDescription:
    "Comment Aiguille relève les prix et les caractéristiques des montres et les compare : sources, fréquence, garantie, entretien, règles de collecte et limites.",
  title: "Méthodologie",
  body: (d) => (
    <>
      <p className="text-lg text-muted-foreground">
        {d.site} publie uniquement des données relevées automatiquement à la source, et explique ici
        comment. Aucune donnée n&apos;est saisie à la main, achetée ou fournie par une marque.
      </p>

      <section className="space-y-3">
        <h2 className={h2}>Sources</h2>
        <p>
          Les prix catalogue et les caractéristiques proviennent des sites officiels des marques,
          dans leur version française (prix en euros, TVA comprise). Les versions nationales
          relevées pour les prix européens fournissent aussi les fiches traduites.
        </p>
        <BrandList
          brands={d.brands}
          separator=" : "
          references={(n) => `${n} références suivies`}
          lastRun={(date) => `, dernier relevé le ${date}`}
        />
        <p>
          Prix réels et stock : revendeurs Lepage et Ocarat. Les disponibilités inconnues sont
          signalées comme telles. Prochaine source envisagée : annonces d&apos;occasion.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2}>Comment les données sont relevées</h2>
        <ul className={list}>
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
        <h2 className={h2}>Une collecte respectueuse</h2>
        <p>
          Notre robot s&apos;identifie (AiguilleBot), respecte les fichiers robots.txt,
          n&apos;envoie qu&apos;une requête à la fois avec au moins quatre secondes
          d&apos;intervalle, et ne reproduit jamais de texte d&apos;avis ou de description rédigé
          par un tiers. Les photos restent hébergées par les marques et sont créditées.
        </p>
      </section>

      <section id="technique" className="scroll-mt-20 space-y-3">
        <h2 className={h2}>Technique, garantie et entretien</h2>
        <p>
          Nous ne disons pas si une montre est « bonne » : le design, la finition ou le plaisir au
          poignet sont subjectifs. Nous présentons ce qui se vérifie, tel que chaque marque le
          publie sur sa fiche officielle, dans une{" "}
          <strong>fiche technique identique pour toutes les marques</strong> : mêmes rubriques
          (mouvement, boîtier, cadran, bracelet, garantie et entretien, historique des pièces
          vintage), mêmes lignes, même ordre. Chaque marque nomme ses caractéristiques à sa façon :
          nous les rapprochons ligne par ligne, et gardons le reste de sa fiche dans « Autres
          informations ».
        </p>
        <p>
          Quand une marque ne publie pas une information, la fiche l&apos;indique : « non communiqué
          par la marque ». Les informations qui ne figurent pas sur les fiches (garantie standard,
          fabricant d&apos;un mouvement) ne sont affichées que si une page publique de la marque les
          établit ; nous gardons sa référence et la date de vérification.
        </p>
        <h3 className={h3}>Garantie et entretien</h3>
        <p>
          La rubrique « Garantie et entretien » reprend ce que chaque marque publie sur ses pages de
          garantie, de conditions de vente et de service client : durée de la garantie et lien vers
          son détail, principales exclusions, prix conseillés de révision complète et partielle
          selon le mouvement (mécanique ou quartz, avec ou sans chronographe), fréquences
          d&apos;entretien recommandées, contrôle d&apos;étanchéité, durée de vie de la pile et
          disponibilité des pièces de rechange. Les tarifs sont des prix conseillés en France, datés
          : ils peuvent avoir changé depuis notre relevé. Les marques qui ne publient pas ces
          informations apparaissent avec « non communiqué ».
        </p>
        <p>
          Les conseils d&apos;entretien sont choisis selon la montre (couronne vissée, chronographe,
          pile…) et reformulés par nos soins. « Recommandé par la marque » renvoie à sa page ; «
          conseil général » signale un conseil d&apos;usage courant que la marque ne publie pas
          elle-même.
        </p>
        <h3 className={h3}>Aussi bien équipées, pour moins cher</h3>
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

      <section className="space-y-3">
        <h2 className={h2}>Langues</h2>
        <p>
          Le site existe en français, anglais, allemand, italien et espagnol. Les fiches
          s&apos;affichent dans la langue choisie quand la marque les publie dans cette langue ;
          sinon, nous affichons sa version anglaise, puis française, avec un avertissement. Les prix
          restent les prix catalogue français.
        </p>
      </section>

      {d.showScore && (
        <section id="note" className="scroll-mt-20 space-y-3">
          <h2 className={h2}>Note Aiguille et avis</h2>
          <p>
            Chaque fiche affiche deux évaluations distinctes, jamais mélangées : la{" "}
            <strong>Note Aiguille</strong> sur 100, notre évaluation fondée sur les faits, et
            l&apos;<strong>avis de la communauté</strong> sur 5, ce qu&apos;en pensent ceux qui la
            portent.
          </p>
          <h3 className={h3}>Toujours dans son registre</h3>
          <p>
            Comparer une montre à 400 € et une montre à 15 000 € n&apos;aurait aucun sens. La Note
            Aiguille juge chaque montre <strong>parmi les montres comparables</strong> : même gamme
            de prix ({d.priceBands}) et même usage ({d.families}). Une excellente montre
            d&apos;entrée de gamme peut donc obtenir 90/100. Quand une catégorie compte moins de{" "}
            {d.minPeers} montres, la comparaison s&apos;étend aux gammes voisines, puis à toutes les
            familles de la gamme : la fiche indique toujours à quelles montres elle est comparée, et
            son rang.
          </p>
          <h3 className={h3}>Les trois piliers de la Note Aiguille</h3>
          <p>
            Chaque pilier combine un barème (25 %) et le rang de la montre dans sa catégorie (75 %).
            Les faits viennent des fiches officielles des marques : une donnée que la marque ne
            publie pas compte pour une valeur moyenne, sans pénaliser ni avantager la montre.
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Mouvement ({d.weights.movement} %)</strong> : type (mécanique ou quartz),
              réserve de marche, fréquence, spiral en silicium ou antimagnétique, certification
              chronomètre (COSC) et complications (chronographe, second fuseau, phases de lune,
              calendriers…).
            </li>
            <li>
              <strong>Construction ({d.weights.construction} %)</strong> : verre saphir et
              antireflet, étanchéité <strong>attendue pour son usage</strong> (une montre de plongée
              doit descendre à 200 m, pas une montre habillée), matière du boîtier, fond
              transparent, couronne vissée, luminescence.
            </li>
            <li>
              <strong>Rapport qualité-prix ({d.weights.value} %)</strong> : équipement (mouvement et
              construction) face au prix parmi les montres comparables, remise chez les revendeurs
              et disponibilité.
            </li>
          </ul>
          <p>
            La confiance de la Note Aiguille dépend de la fiche de la marque (calibre, réserve de
            marche, verre, étanchéité, matière) et du nombre de montres comparables. La note est
            recalculée chaque nuit après le relevé des prix.
          </p>
          <h3 className={h3}>Ce que la Note Aiguille ne juge pas</h3>
          <p>
            Le design, la finition réelle, le confort au poignet ou l&apos;histoire d&apos;un modèle
            ne se mesurent pas sur une fiche technique : nous ne les notons pas nous-mêmes. Ils sont
            l&apos;affaire de l&apos;avis de la communauté. La rareté (édition limitée, modèle plus
            produit) est signalée, sans bonus : rare ne veut pas dire meilleure.
          </p>
        </section>
      )}

      {d.showReviews && (
        <section id="avis" className="scroll-mt-20 space-y-3">
          <h2 className={h2}>L&apos;avis de la communauté</h2>
          <p>
            Les visiteurs connectés notent de 1 à 5 la finition, le design, le confort, la
            lisibilité, la précision et le rapport qualité-prix,{" "}
            <strong>par rapport à ce qu&apos;on peut attendre à son prix</strong>, avec un seul avis
            par personne et par montre. La fiche affiche la moyenne brute et le nombre d&apos;avis :
            c&apos;est l&apos;opinion de ceux qui la portent, pas la nôtre. Pour classer les
            montres, la moyenne est <strong>bayésienne</strong> : elle part de {d.priorMean}/5 comme
            si la montre avait déjà {d.priorWeight} avis moyens, pour qu&apos;un avis isolé à 5/5 ne
            passe pas devant cent avis à 4,6/5.
          </p>
          <p>
            Les notes publiées par d&apos;autres sites spécialisés rejoindront cet avis, sous forme
            de note agrégée et de lien vers leur source, sans jamais reproduire leur texte.
          </p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className={h2}>Limites connues</h2>
        <ul className={list}>
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
    </>
  ),
};

/** Mêmes rubriques que le français, rédigées pour chaque langue. */
function translated(t: {
  metaTitle: string;
  metaDescription: string;
  title: string;
  intro: (site: string) => string;
  sources: string;
  sourcesText: string;
  references: (count: string) => string;
  lastRun: (date: string) => string;
  retailers: string;
  howTitle: string;
  how: string[];
  politeTitle: string;
  polite: string;
  techTitle: string;
  tech: string[];
  warrantyTitle: string;
  warranty: string[];
  alternativesTitle: string;
  alternatives: string;
  languagesTitle: string;
  languages: string;
  scoreTitle: string;
  score: (d: MethodologyData) => string[];
  pillars: (d: MethodologyData) => [string, string][];
  scoreAfter: string[];
  reviewsTitle: string;
  reviews: (d: MethodologyData) => string[];
  limitsTitle: string;
  limits: string[];
}): MethodologyContent {
  return {
    metaTitle: t.metaTitle,
    metaDescription: t.metaDescription,
    title: t.title,
    body: (d) => (
      <>
        <p className="text-lg text-muted-foreground">{t.intro(d.site)}</p>
        <section className="space-y-3">
          <h2 className={h2}>{t.sources}</h2>
          <p>{t.sourcesText}</p>
          <BrandList
            brands={d.brands}
            separator=": "
            references={t.references}
            lastRun={t.lastRun}
          />
          <p>{t.retailers}</p>
        </section>
        <section className="space-y-3">
          <h2 className={h2}>{t.howTitle}</h2>
          <ul className={list}>
            {t.how.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className={h2}>{t.politeTitle}</h2>
          <p>{t.polite}</p>
        </section>
        <section id="technique" className="scroll-mt-20 space-y-3">
          <h2 className={h2}>{t.techTitle}</h2>
          {t.tech.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <h3 className={h3}>{t.warrantyTitle}</h3>
          {t.warranty.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <h3 className={h3}>{t.alternativesTitle}</h3>
          <p>{t.alternatives}</p>
        </section>
        <section className="space-y-3">
          <h2 className={h2}>{t.languagesTitle}</h2>
          <p>{t.languages}</p>
        </section>
        {d.showScore && (
          <section id="note" className="scroll-mt-20 space-y-3">
            <h2 className={h2}>{t.scoreTitle}</h2>
            {t.score(d).map((p) => (
              <p key={p}>{p}</p>
            ))}
            <ul className="list-disc space-y-2 pl-6">
              {t.pillars(d).map(([name, text]) => (
                <li key={name}>
                  <strong>{name}</strong> : {text}
                </li>
              ))}
            </ul>
            {t.scoreAfter.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        )}
        {d.showReviews && (
          <section id="avis" className="scroll-mt-20 space-y-3">
            <h2 className={h2}>{t.reviewsTitle}</h2>
            {t.reviews(d).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        )}
        <section className="space-y-3">
          <h2 className={h2}>{t.limitsTitle}</h2>
          <ul className={list}>
            {t.limits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </>
    ),
  };
}

const en = translated({
  metaTitle: "Methodology: where our prices and data come from",
  metaDescription:
    "How Aiguille collects watch prices and specifications and compares them: sources, frequency, warranty, servicing, collection rules and limits.",
  title: "Methodology",
  intro: (site) =>
    `${site} only publishes data collected automatically at the source, and explains how here. No data is entered by hand, bought or supplied by a brand.`,
  sources: "Sources",
  sourcesText:
    "List prices and specifications come from the brands' official websites, in their French version (prices in euros, VAT included). The national versions checked for European prices also provide the translated pages.",
  references: (n) => `${n} references tracked`,
  lastRun: (date) => `, last checked on ${date}`,
  retailers:
    "Real prices and stock: the retailers Lepage and Ocarat. Unknown availability is shown as such. Next source considered: pre-owned listings.",
  howTitle: "How the data is collected",
  how: [
    "Each product page is read as the brand publishes it, from the structured data intended for search engines and from the specification table.",
    "Any incomplete or inconsistent page is rejected rather than published approximately.",
    "A new price is only recorded when it changes: the history reflects real changes, not a repeated daily check.",
    "A reference that disappears from the brand's website stays online, marked “discontinued”, for pre-owned buyers.",
  ],
  politeTitle: "Respectful collection",
  polite:
    "Our robot identifies itself (AiguilleBot), respects robots.txt files, sends only one request at a time with at least four seconds between them, and never reproduces review or description text written by a third party. Photos remain hosted by the brands and are credited.",
  techTitle: "Specifications, warranty and servicing",
  tech: [
    "We do not say whether a watch is “good”: design, finishing and the pleasure of wearing it are subjective. We present what can be verified, as each brand publishes it on its official page, in a specification sheet identical for every brand: same sections (movement, case, dial, strap, warranty and servicing, history of vintage pieces), same rows, same order. Each brand names its specifications its own way: we match them row by row and keep the rest of its page under “Other information”.",
    "When a brand does not publish a piece of information, the sheet says so: “not disclosed by the brand”. Information that does not appear on product pages (standard warranty, movement maker) is only shown if a public page of the brand establishes it; we keep its reference and the date it was checked.",
  ],
  warrantyTitle: "Warranty and servicing",
  warranty: [
    "The “Warranty and servicing” section reflects what each brand publishes on its warranty, terms of sale and customer service pages: warranty length and a link to its details, main exclusions, recommended prices for full and partial servicing depending on the movement (mechanical or quartz, with or without chronograph), recommended service intervals, water-resistance checks, battery life and spare-part availability. Prices are recommended prices in France, dated: they may have changed since our check. Brands that do not publish this information appear as “not disclosed”.",
    "Care tips are chosen for the watch (screw-down crown, chronograph, battery…) and reworded by us. “Recommended by the brand” links to its page; “general advice” marks common-sense advice that the brand does not publish itself.",
  ],
  alternativesTitle: "Equally well equipped, for less",
  alternatives:
    "Below each page, we suggest up to three watches for the same use (diving, dress, chronograph…), of similar diameter (at most 3 mm difference) and at least 10% cheaper, that do at least as well on every published technical point: movement type, power reserve, sapphire crystal, water resistance, hairspring, certification, functions, warranty, ceramic bezel and screw-down crown, noble material. A piece of data known for the watch being viewed must also be known for the alternative: we promise nothing without proof. Vintage pieces are neither compared nor suggested.",
  languagesTitle: "Languages",
  languages:
    "The site exists in French, English, German, Italian and Spanish. Watch pages are shown in the chosen language when the brand publishes them in that language; otherwise we show its English version, then French, with a notice. Prices remain the French list prices.",
  scoreTitle: "Aiguille score and reviews",
  score: (d) => [
    "Each page shows two separate assessments, never mixed: the Aiguille score out of 100, our fact-based assessment, and the community rating out of 5, what those who wear the watch think.",
    `Comparing a €400 watch with a €15,000 one would make no sense. The Aiguille score judges each watch among comparable watches: same price range and same use. An excellent entry-level watch can therefore score 90/100. When a category has fewer than ${d.minPeers} watches, the comparison extends to neighbouring ranges, then to all families in the range: the page always says which watches it is compared with, and its rank.`,
    "Each pillar combines a scale (25%) and the watch's rank in its category (75%). Facts come from the brands' official pages: data the brand does not publish counts as an average value, neither penalising nor favouring the watch.",
  ],
  pillars: (d) => [
    [
      `Movement (${d.weights.movement}%)`,
      "type (mechanical or quartz), power reserve, frequency, silicon or anti-magnetic hairspring, chronometer certification (COSC) and complications (chronograph, second time zone, moon phases, calendars…).",
    ],
    [
      `Construction (${d.weights.construction}%)`,
      "sapphire crystal and anti-reflective coating, water resistance expected for its use (a dive watch should reach 200 m, a dress watch need not), case material, transparent case back, screw-down crown, luminescence.",
    ],
    [
      `Value for money (${d.weights.value}%)`,
      "features (movement and construction) against price among comparable watches, retailer discounts and availability.",
    ],
  ],
  scoreAfter: [
    "The confidence of the Aiguille score depends on the brand's page (calibre, power reserve, crystal, water resistance, material) and on the number of comparable watches. The score is recalculated every night after the price check.",
    "Design, real finishing, wrist comfort or a model's history cannot be measured on a specification sheet: we do not rate them ourselves. They are a matter for the community rating. Rarity (limited edition, discontinued model) is shown without a bonus: rare does not mean better.",
  ],
  reviewsTitle: "The community rating",
  reviews: (d) => [
    `Signed-in visitors rate finishing, design, comfort, legibility, accuracy and value for money from 1 to 5, relative to what you can expect at the watch's price, with one review per person and per watch. The page shows the raw average and the number of reviews: it is the opinion of those who wear it, not ours. To rank watches, the average is Bayesian: it starts from ${d.priorMean}/5 as if the watch already had ${d.priorWeight} average reviews, so that a single 5/5 review does not rank above a hundred 4.6/5 reviews.`,
    "Ratings published by other specialist sites will join this rating, as an aggregated score with a link to their source, never reproducing their text.",
  ],
  limitsTitle: "Known limits",
  limits: [
    "The list price is the recommended retail price: each retailer may charge other prices, and we only track two for now.",
    "Specifications are those published by the brand; an error on its side appears here too.",
    "The price history starts on the date of our first checks (October 2026).",
    "Technical information depends on what each brand publishes: a brand that gives fewer details about its movements (frequency, hairspring, maker) shows more “not disclosed”. Use families are inferred from names and specifications and may be wrong for a few models.",
  ],
});

const de = translated({
  metaTitle: "Methodik: Woher unsere Preise und Daten stammen",
  metaDescription:
    "Wie Aiguille Preise und technische Daten von Uhren erfasst und vergleicht: Quellen, Häufigkeit, Garantie, Wartung, Erfassungsregeln und Grenzen.",
  title: "Methodik",
  intro: (site) =>
    `${site} veröffentlicht nur Daten, die automatisch an der Quelle erfasst werden, und erklärt hier, wie. Keine Angabe wird von Hand eingegeben, gekauft oder von einer Marke geliefert.`,
  sources: "Quellen",
  sourcesText:
    "Listenpreise und technische Daten stammen von den offiziellen Websites der Marken, in ihrer französischen Version (Preise in Euro, inklusive MwSt.). Die für die europäischen Preise erfassten nationalen Versionen liefern auch die übersetzten Seiten.",
  references: (n) => `${n} beobachtete Referenzen`,
  lastRun: (date) => `, letzte Erfassung am ${date}`,
  retailers:
    "Tatsächliche Preise und Bestand: die Händler Lepage und Ocarat. Unbekannte Verfügbarkeiten werden als solche angezeigt. Nächste geplante Quelle: Gebrauchtanzeigen.",
  howTitle: "Wie die Daten erfasst werden",
  how: [
    "Jede Produktseite wird so gelesen, wie die Marke sie veröffentlicht: aus den strukturierten Daten für Suchmaschinen und der Tabelle der technischen Daten.",
    "Jede unvollständige oder widersprüchliche Seite wird verworfen, statt ungenau veröffentlicht zu werden.",
    "Ein neuer Preis wird nur gespeichert, wenn er sich ändert: Der Verlauf zeigt echte Änderungen, keine wiederholte tägliche Erfassung.",
    "Eine Referenz, die von der Website der Marke verschwindet, bleibt online und wird als „nicht mehr hergestellt“ gekennzeichnet, für Käufer von Gebrauchtuhren.",
  ],
  politeTitle: "Eine rücksichtsvolle Erfassung",
  polite:
    "Unser Robot gibt sich zu erkennen (AiguilleBot), beachtet robots.txt-Dateien, sendet nur eine Anfrage gleichzeitig mit mindestens vier Sekunden Abstand und gibt nie Bewertungs- oder Beschreibungstexte Dritter wieder. Die Fotos bleiben bei den Marken gehostet und werden genannt.",
  techTitle: "Technik, Garantie und Wartung",
  tech: [
    "Wir sagen nicht, ob eine Uhr „gut“ ist: Design, Verarbeitung und Tragefreude sind subjektiv. Wir zeigen, was sich überprüfen lässt, so wie jede Marke es auf ihrer offiziellen Seite veröffentlicht, in technischen Daten, die für alle Marken gleich aufgebaut sind: dieselben Abschnitte (Uhrwerk, Gehäuse, Zifferblatt, Armband, Garantie und Wartung, Geschichte von Vintage-Stücken), dieselben Zeilen, dieselbe Reihenfolge. Jede Marke benennt ihre Merkmale anders: Wir ordnen sie Zeile für Zeile zu und behalten den Rest ihrer Seite unter „Weitere Angaben“.",
    "Wenn eine Marke eine Angabe nicht veröffentlicht, steht dort „von der Marke nicht angegeben“. Angaben, die nicht auf den Produktseiten stehen (Standardgarantie, Werkhersteller), werden nur angezeigt, wenn eine öffentliche Seite der Marke sie belegt; wir bewahren die Quelle und das Prüfdatum auf.",
  ],
  warrantyTitle: "Garantie und Wartung",
  warranty: [
    "Der Abschnitt „Garantie und Wartung“ übernimmt, was jede Marke auf ihren Seiten zu Garantie, Verkaufsbedingungen und Kundendienst veröffentlicht: Garantiedauer und Link zu den Details, wichtigste Ausschlüsse, empfohlene Preise für komplette und Teilrevision je nach Uhrwerk (mechanisch oder Quarz, mit oder ohne Chronograph), empfohlene Wartungsintervalle, Dichtigkeitsprüfung, Batterielebensdauer und Verfügbarkeit von Ersatzteilen. Die Preise sind datierte Preisempfehlungen in Frankreich: Sie können sich seit unserer Erfassung geändert haben. Marken, die diese Angaben nicht veröffentlichen, erscheinen mit „nicht angegeben“.",
    "Die Pflegehinweise werden passend zur Uhr ausgewählt (verschraubte Krone, Chronograph, Batterie…) und von uns umformuliert. „Empfohlen von der Marke“ verweist auf ihre Seite; „Allgemeiner Hinweis“ kennzeichnet einen üblichen Rat, den die Marke selbst nicht veröffentlicht.",
  ],
  alternativesTitle: "Ebenso gut ausgestattet, aber günstiger",
  alternatives:
    "Unter jeder Seite schlagen wir bis zu drei Uhren für denselben Zweck vor (Taucher-, Dress-, Chronographenuhr…), mit ähnlichem Durchmesser (höchstens 3 mm Unterschied) und mindestens 10 % günstiger, die bei jedem veröffentlichten technischen Merkmal mindestens ebenso gut abschneiden: Art des Uhrwerks, Gangreserve, Saphirglas, Wasserdichtigkeit, Spirale, Zertifizierung, Funktionen, Garantie, Keramiklünette und verschraubte Krone, edles Material. Eine für die betrachtete Uhr bekannte Angabe muss auch für die Alternative bekannt sein: Wir versprechen nichts ohne Beleg. Vintage-Stücke werden weder verglichen noch vorgeschlagen.",
  languagesTitle: "Sprachen",
  languages:
    "Die Website gibt es auf Französisch, Englisch, Deutsch, Italienisch und Spanisch. Uhrenseiten erscheinen in der gewählten Sprache, wenn die Marke sie in dieser Sprache veröffentlicht; sonst zeigen wir ihre englische, dann französische Version, mit einem Hinweis. Die Preise bleiben die französischen Listenpreise.",
  scoreTitle: "Aiguille-Bewertung und Meinungen",
  score: (d) => [
    "Jede Seite zeigt zwei getrennte Bewertungen, nie vermischt: die Aiguille-Bewertung von 100, unsere faktenbasierte Einschätzung, und die Community-Bewertung von 5, die Meinung derer, die die Uhr tragen.",
    `Eine Uhr für 400 € mit einer für 15.000 € zu vergleichen, wäre sinnlos. Die Aiguille-Bewertung beurteilt jede Uhr unter vergleichbaren Uhren: gleiche Preisklasse und gleicher Zweck. Eine ausgezeichnete Einstiegsuhr kann also 90/100 erreichen. Hat eine Kategorie weniger als ${d.minPeers} Uhren, wird der Vergleich auf benachbarte Preisklassen und dann auf alle Familien der Klasse ausgeweitet: Die Seite nennt immer, womit verglichen wird, und den Rang.`,
    "Jede Säule kombiniert eine Skala (25 %) und den Rang der Uhr in ihrer Kategorie (75 %). Die Fakten stammen von den offiziellen Seiten der Marken: Eine nicht veröffentlichte Angabe zählt als Durchschnittswert, ohne die Uhr zu benachteiligen oder zu bevorzugen.",
  ],
  pillars: (d) => [
    [
      `Uhrwerk (${d.weights.movement} %)`,
      "Typ (mechanisch oder Quarz), Gangreserve, Frequenz, Silizium- oder antimagnetische Spirale, Chronometer-Zertifizierung (COSC) und Komplikationen (Chronograph, zweite Zeitzone, Mondphasen, Kalender…).",
    ],
    [
      `Konstruktion (${d.weights.construction} %)`,
      "Saphirglas und Entspiegelung, für den Zweck erwartete Wasserdichtigkeit (eine Taucheruhr sollte 200 m erreichen, eine Dress-Uhr nicht), Gehäusematerial, transparenter Boden, verschraubte Krone, Leuchtmasse.",
    ],
    [
      `Preis-Leistungs-Verhältnis (${d.weights.value} %)`,
      "Ausstattung (Uhrwerk und Konstruktion) im Verhältnis zum Preis unter vergleichbaren Uhren, Rabatte der Händler und Verfügbarkeit.",
    ],
  ],
  scoreAfter: [
    "Die Zuverlässigkeit der Aiguille-Bewertung hängt von der Seite der Marke (Kaliber, Gangreserve, Glas, Wasserdichtigkeit, Material) und der Zahl vergleichbarer Uhren ab. Die Bewertung wird jede Nacht nach der Preiserfassung neu berechnet.",
    "Design, tatsächliche Verarbeitung, Tragekomfort oder die Geschichte eines Modells lassen sich nicht an technischen Daten messen: Wir bewerten sie nicht selbst. Das ist Sache der Community-Bewertung. Seltenheit (limitierte Auflage, eingestelltes Modell) wird angezeigt, ohne Bonus: selten heißt nicht besser.",
  ],
  reviewsTitle: "Die Community-Bewertung",
  reviews: (d) => [
    `Angemeldete Besucher bewerten Verarbeitung, Design, Komfort, Ablesbarkeit, Ganggenauigkeit und Preis-Leistungs-Verhältnis von 1 bis 5, im Verhältnis zu dem, was man zu ihrem Preis erwarten kann, mit einer Meinung pro Person und Uhr. Die Seite zeigt den Rohdurchschnitt und die Zahl der Meinungen: Es ist die Meinung derer, die sie tragen, nicht unsere. Für die Rangfolge ist der Durchschnitt bayessch: Er beginnt bei ${d.priorMean}/5, als hätte die Uhr bereits ${d.priorWeight} durchschnittliche Meinungen, damit eine einzelne 5/5-Meinung nicht vor hundert Meinungen mit 4,6/5 liegt.`,
    "Bewertungen anderer Fachseiten kommen hinzu, als zusammengefasste Note mit Link zur Quelle, ohne je ihren Text wiederzugeben.",
  ],
  limitsTitle: "Bekannte Grenzen",
  limits: [
    "Der Listenpreis ist die unverbindliche Preisempfehlung: Jeder Händler kann andere Preise verlangen, und wir beobachten vorerst nur zwei.",
    "Die technischen Daten sind die von der Marke veröffentlichten; ein Fehler ihrerseits erscheint auch hier.",
    "Der Preisverlauf beginnt mit unseren ersten Erfassungen (Oktober 2026).",
    "Die technischen Angaben hängen davon ab, was jede Marke veröffentlicht: Eine Marke, die ihre Uhrwerke weniger detailliert beschreibt (Frequenz, Spirale, Hersteller), erscheint öfter mit „nicht angegeben“. Die Nutzungsfamilien werden aus Namen und Merkmalen abgeleitet und können bei einigen Modellen falsch sein.",
  ],
});

const it = translated({
  metaTitle: "Metodologia: da dove vengono i nostri prezzi e dati",
  metaDescription:
    "Come Aiguille rileva i prezzi e le caratteristiche degli orologi e li confronta: fonti, frequenza, garanzia, manutenzione, regole di raccolta e limiti.",
  title: "Metodologia",
  intro: (site) =>
    `${site} pubblica solo dati rilevati automaticamente alla fonte, e spiega qui come. Nessun dato è inserito a mano, acquistato o fornito da un marchio.`,
  sources: "Fonti",
  sourcesText:
    "I prezzi di listino e le caratteristiche provengono dai siti ufficiali dei marchi, nella loro versione francese (prezzi in euro, IVA inclusa). Le versioni nazionali rilevate per i prezzi europei forniscono anche le schede tradotte.",
  references: (n) => `${n} referenze seguite`,
  lastRun: (date) => `, ultimo rilevamento il ${date}`,
  retailers:
    "Prezzi reali e disponibilità: i rivenditori Lepage e Ocarat. Le disponibilità sconosciute sono indicate come tali. Prossima fonte prevista: annunci dell'usato.",
  howTitle: "Come vengono rilevati i dati",
  how: [
    "Ogni scheda prodotto è letta così come il marchio la pubblica, a partire dai dati strutturati destinati ai motori di ricerca e dalla tabella delle caratteristiche.",
    "Ogni scheda incompleta o incoerente viene scartata anziché pubblicata in modo approssimativo.",
    "Un nuovo prezzo viene registrato solo se cambia: lo storico riflette le vere variazioni, non un rilevamento quotidiano ripetuto.",
    "Una referenza che scompare dal sito del marchio resta online, indicata come «fuori produzione», per chi compra usato.",
  ],
  politeTitle: "Una raccolta rispettosa",
  polite:
    "Il nostro robot si identifica (AiguilleBot), rispetta i file robots.txt, invia una sola richiesta alla volta con almeno quattro secondi di intervallo e non riproduce mai testi di recensioni o descrizioni scritti da terzi. Le foto restano ospitate dai marchi e sono citate.",
  techTitle: "Tecnica, garanzia e manutenzione",
  tech: [
    "Non diciamo se un orologio è «buono»: design, finiture e piacere al polso sono soggettivi. Presentiamo ciò che si può verificare, così come ogni marchio lo pubblica sulla sua scheda ufficiale, in una scheda tecnica identica per tutti i marchi: stesse sezioni (movimento, cassa, quadrante, cinturino, garanzia e manutenzione, storia dei pezzi vintage), stesse righe, stesso ordine. Ogni marchio chiama le sue caratteristiche a modo suo: le facciamo corrispondere riga per riga e conserviamo il resto della scheda in «Altre informazioni».",
    "Quando un marchio non pubblica un'informazione, la scheda lo indica: «non comunicato dal marchio». Le informazioni che non compaiono sulle schede (garanzia standard, produttore del movimento) sono mostrate solo se una pagina pubblica del marchio le stabilisce; conserviamo la fonte e la data di verifica.",
  ],
  warrantyTitle: "Garanzia e manutenzione",
  warranty: [
    "La sezione «Garanzia e manutenzione» riprende ciò che ogni marchio pubblica nelle sue pagine di garanzia, condizioni di vendita e servizio clienti: durata della garanzia e link al dettaglio, principali esclusioni, prezzi consigliati di revisione completa e parziale secondo il movimento (meccanico o al quarzo, con o senza cronografo), frequenze di manutenzione consigliate, controllo dell'impermeabilità, durata della batteria e disponibilità dei ricambi. Le tariffe sono prezzi consigliati in Francia, datati: possono essere cambiati dal nostro rilevamento. I marchi che non pubblicano queste informazioni compaiono con «non comunicato».",
    "I consigli di manutenzione sono scelti in base all'orologio (corona a vite, cronografo, batteria…) e riformulati da noi. «Consigliato dal marchio» rimanda alla sua pagina; «consiglio generale» indica un consiglio d'uso comune che il marchio non pubblica.",
  ],
  alternativesTitle: "Altrettanto ben equipaggiati, a meno",
  alternatives:
    "Sotto ogni scheda proponiamo fino a tre orologi dello stesso uso (subacqueo, elegante, cronografo…), di diametro simile (al massimo 3 mm di differenza) e almeno il 10 % più economici, che fanno almeno altrettanto bene su ogni punto tecnico pubblicato: tipo di movimento, riserva di carica, vetro zaffiro, impermeabilità, spirale, certificazione, funzioni, garanzia, lunetta in ceramica e corona a vite, materiale nobile. Un dato noto per l'orologio consultato deve esserlo anche per l'alternativa: non promettiamo nulla senza prove. I pezzi vintage non sono né confrontati né proposti.",
  languagesTitle: "Lingue",
  languages:
    "Il sito esiste in francese, inglese, tedesco, italiano e spagnolo. Le schede compaiono nella lingua scelta quando il marchio le pubblica in quella lingua; altrimenti mostriamo la versione inglese, poi francese, con un avviso. I prezzi restano i prezzi di listino francesi.",
  scoreTitle: "Punteggio Aiguille e opinioni",
  score: (d) => [
    "Ogni scheda mostra due valutazioni distinte, mai mescolate: il punteggio Aiguille su 100, la nostra valutazione basata sui fatti, e il giudizio della community su 5, ciò che ne pensa chi lo porta.",
    `Confrontare un orologio da 400 € con uno da 15.000 € non avrebbe senso. Il punteggio Aiguille giudica ogni orologio tra orologi comparabili: stessa fascia di prezzo e stesso uso. Un ottimo orologio d'ingresso può quindi ottenere 90/100. Quando una categoria conta meno di ${d.minPeers} orologi, il confronto si estende alle fasce vicine, poi a tutte le famiglie della fascia: la scheda indica sempre con quali orologi è confrontato e la sua posizione.`,
    "Ogni pilastro combina una scala (25 %) e la posizione dell'orologio nella sua categoria (75 %). I fatti provengono dalle schede ufficiali dei marchi: un dato non pubblicato vale come valore medio, senza penalizzare né favorire l'orologio.",
  ],
  pillars: (d) => [
    [
      `Movimento (${d.weights.movement} %)`,
      "tipo (meccanico o al quarzo), riserva di carica, frequenza, spirale in silicio o antimagnetica, certificazione cronometro (COSC) e complicazioni (cronografo, secondo fuso, fasi lunari, calendari…).",
    ],
    [
      `Costruzione (${d.weights.construction} %)`,
      "vetro zaffiro e antiriflesso, impermeabilità attesa per il suo uso (un subacqueo deve scendere a 200 m, un elegante no), materiale della cassa, fondello trasparente, corona a vite, luminescenza.",
    ],
    [
      `Rapporto qualità-prezzo (${d.weights.value} %)`,
      "dotazione (movimento e costruzione) rispetto al prezzo tra orologi comparabili, sconti dei rivenditori e disponibilità.",
    ],
  ],
  scoreAfter: [
    "L'affidabilità del punteggio Aiguille dipende dalla scheda del marchio (calibro, riserva di carica, vetro, impermeabilità, materiale) e dal numero di orologi comparabili. Il punteggio viene ricalcolato ogni notte dopo il rilevamento dei prezzi.",
    "Il design, le finiture reali, il comfort al polso o la storia di un modello non si misurano su una scheda tecnica: non li valutiamo noi. Sono compito del giudizio della community. La rarità (edizione limitata, modello fuori produzione) è segnalata, senza bonus: raro non vuol dire migliore.",
  ],
  reviewsTitle: "Il giudizio della community",
  reviews: (d) => [
    `I visitatori connessi valutano da 1 a 5 finiture, design, comfort, leggibilità, precisione e rapporto qualità-prezzo, rispetto a ciò che ci si può aspettare al suo prezzo, con una sola opinione per persona e per orologio. La scheda mostra la media grezza e il numero di opinioni: è il parere di chi lo porta, non il nostro. Per classificare gli orologi, la media è bayesiana: parte da ${d.priorMean}/5 come se l'orologio avesse già ${d.priorWeight} opinioni medie, perché un'opinione isolata a 5/5 non superi cento opinioni a 4,6/5.`,
    "I voti pubblicati da altri siti specializzati si aggiungeranno a questo giudizio, come voto aggregato con un link alla fonte, senza mai riprodurne il testo.",
  ],
  limitsTitle: "Limiti noti",
  limits: [
    "Il prezzo di listino è il prezzo al pubblico consigliato: ogni rivenditore può praticare altri prezzi, e per ora ne seguiamo solo due.",
    "Le caratteristiche sono quelle pubblicate dal marchio; un suo errore si ritrova anche qui.",
    "Lo storico dei prezzi inizia dalla data dei nostri primi rilevamenti (ottobre 2026).",
    "Le informazioni tecniche dipendono da ciò che ogni marchio pubblica: un marchio che descrive meno i suoi movimenti (frequenza, spirale, produttore) compare con più «non comunicato». Le famiglie d'uso sono dedotte da nomi e caratteristiche e possono sbagliare su alcuni modelli.",
  ],
});

const es = translated({
  metaTitle: "Metodología: de dónde vienen nuestros precios y datos",
  metaDescription:
    "Cómo Aiguille recopila los precios y las características de los relojes y los compara: fuentes, frecuencia, garantía, mantenimiento, reglas de recopilación y límites.",
  title: "Metodología",
  intro: (site) =>
    `${site} solo publica datos recopilados automáticamente en la fuente, y explica aquí cómo. Ningún dato se introduce a mano, se compra o lo proporciona una marca.`,
  sources: "Fuentes",
  sourcesText:
    "Los precios de catálogo y las características proceden de las webs oficiales de las marcas, en su versión francesa (precios en euros, IVA incluido). Las versiones nacionales consultadas para los precios europeos también proporcionan las fichas traducidas.",
  references: (n) => `${n} referencias seguidas`,
  lastRun: (date) => `, última consulta el ${date}`,
  retailers:
    "Precios reales y stock: los distribuidores Lepage y Ocarat. Las disponibilidades desconocidas se indican como tales. Próxima fuente prevista: anuncios de segunda mano.",
  howTitle: "Cómo se recopilan los datos",
  how: [
    "Cada ficha de producto se lee tal como la publica la marca, a partir de los datos estructurados destinados a los buscadores y de la tabla de características.",
    "Toda ficha incompleta o incoherente se descarta en lugar de publicarse de forma aproximada.",
    "Un nuevo precio solo se registra si cambia: el historial refleja las variaciones reales, no una consulta diaria repetida.",
    "Una referencia que desaparece de la web de la marca sigue en línea, marcada como «descatalogada», para los compradores de segunda mano.",
  ],
  politeTitle: "Una recopilación respetuosa",
  polite:
    "Nuestro robot se identifica (AiguilleBot), respeta los archivos robots.txt, envía una sola solicitud a la vez con al menos cuatro segundos de intervalo y nunca reproduce textos de opiniones o descripciones escritos por terceros. Las fotos siguen alojadas por las marcas y se citan.",
  techTitle: "Técnica, garantía y mantenimiento",
  tech: [
    "No decimos si un reloj es «bueno»: el diseño, los acabados o el placer en la muñeca son subjetivos. Presentamos lo que se puede verificar, tal como cada marca lo publica en su ficha oficial, en una ficha técnica idéntica para todas las marcas: mismas secciones (movimiento, caja, esfera, correa, garantía y mantenimiento, historia de las piezas vintage), mismas líneas, mismo orden. Cada marca nombra sus características a su manera: las emparejamos línea por línea y conservamos el resto de su ficha en «Otra información».",
    "Cuando una marca no publica un dato, la ficha lo indica: «no comunicado por la marca». La información que no figura en las fichas (garantía estándar, fabricante del movimiento) solo se muestra si una página pública de la marca la establece; conservamos su referencia y la fecha de verificación.",
  ],
  warrantyTitle: "Garantía y mantenimiento",
  warranty: [
    "La sección «Garantía y mantenimiento» recoge lo que cada marca publica en sus páginas de garantía, condiciones de venta y atención al cliente: duración de la garantía y enlace a su detalle, principales exclusiones, precios recomendados del servicio completo y parcial según el movimiento (mecánico o de cuarzo, con o sin cronógrafo), frecuencias de mantenimiento recomendadas, control de estanqueidad, duración de la pila y disponibilidad de recambios. Las tarifas son precios recomendados en Francia, fechados: pueden haber cambiado desde nuestra consulta. Las marcas que no publican esta información aparecen con «no comunicado».",
    "Los consejos de mantenimiento se eligen según el reloj (corona enroscada, cronógrafo, pila…) y los reformulamos nosotros. «Recomendado por la marca» remite a su página; «consejo general» indica un consejo de uso habitual que la marca no publica.",
  ],
  alternativesTitle: "Igual de bien equipados, por menos",
  alternatives:
    "Bajo cada ficha proponemos hasta tres relojes del mismo uso (buceo, vestir, cronógrafo…), de diámetro similar (como máximo 3 mm de diferencia) y al menos un 10 % más baratos, que están al menos al mismo nivel en cada punto técnico publicado: tipo de movimiento, reserva de marcha, cristal de zafiro, estanqueidad, espiral, certificación, funciones, garantía, bisel de cerámica y corona enroscada, material noble. Un dato conocido del reloj consultado debe serlo también de la alternativa: no prometemos nada sin pruebas. Las piezas vintage no se comparan ni se proponen.",
  languagesTitle: "Idiomas",
  languages:
    "El sitio existe en francés, inglés, alemán, italiano y español. Las fichas se muestran en el idioma elegido cuando la marca las publica en ese idioma; si no, mostramos su versión inglesa y luego francesa, con un aviso. Los precios siguen siendo los precios de catálogo franceses.",
  scoreTitle: "Puntuación Aiguille y opiniones",
  score: (d) => [
    "Cada ficha muestra dos evaluaciones distintas, nunca mezcladas: la puntuación Aiguille sobre 100, nuestra evaluación basada en hechos, y la valoración de la comunidad sobre 5, lo que opinan quienes lo llevan.",
    `Comparar un reloj de 400 € con uno de 15.000 € no tendría sentido. La puntuación Aiguille juzga cada reloj entre relojes comparables: mismo rango de precio y mismo uso. Un reloj de entrada excelente puede obtener, por tanto, 90/100. Cuando una categoría tiene menos de ${d.minPeers} relojes, la comparación se amplía a los rangos vecinos y luego a todas las familias del rango: la ficha siempre indica con qué relojes se compara y su posición.`,
    "Cada pilar combina una escala (25 %) y la posición del reloj en su categoría (75 %). Los hechos proceden de las fichas oficiales de las marcas: un dato que la marca no publica cuenta como valor medio, sin penalizar ni favorecer al reloj.",
  ],
  pillars: (d) => [
    [
      `Movimiento (${d.weights.movement} %)`,
      "tipo (mecánico o de cuarzo), reserva de marcha, frecuencia, espiral de silicio o antimagnética, certificación de cronómetro (COSC) y complicaciones (cronógrafo, segundo huso, fases lunares, calendarios…).",
    ],
    [
      `Construcción (${d.weights.construction} %)`,
      "cristal de zafiro y antirreflejos, estanqueidad esperada para su uso (un reloj de buceo debe llegar a 200 m, uno de vestir no), material de la caja, fondo transparente, corona enroscada, luminiscencia.",
    ],
    [
      `Relación calidad-precio (${d.weights.value} %)`,
      "equipamiento (movimiento y construcción) frente al precio entre relojes comparables, descuentos de los distribuidores y disponibilidad.",
    ],
  ],
  scoreAfter: [
    "La fiabilidad de la puntuación Aiguille depende de la ficha de la marca (calibre, reserva de marcha, cristal, estanqueidad, material) y del número de relojes comparables. La puntuación se recalcula cada noche tras la consulta de precios.",
    "El diseño, los acabados reales, la comodidad en la muñeca o la historia de un modelo no se miden en una ficha técnica: no los puntuamos nosotros. Son cosa de la valoración de la comunidad. La rareza (edición limitada, modelo descatalogado) se indica, sin bonificación: raro no significa mejor.",
  ],
  reviewsTitle: "La valoración de la comunidad",
  reviews: (d) => [
    `Los visitantes que han iniciado sesión valoran de 1 a 5 los acabados, el diseño, la comodidad, la legibilidad, la precisión y la relación calidad-precio, respecto a lo que se puede esperar por su precio, con una sola opinión por persona y por reloj. La ficha muestra la media bruta y el número de opiniones: es la opinión de quienes lo llevan, no la nuestra. Para clasificar los relojes, la media es bayesiana: parte de ${d.priorMean}/5 como si el reloj ya tuviera ${d.priorWeight} opiniones medias, para que una sola opinión de 5/5 no supere a cien opiniones de 4,6/5.`,
    "Las valoraciones publicadas por otros sitios especializados se sumarán a esta, como puntuación agregada con un enlace a su fuente, sin reproducir nunca su texto.",
  ],
  limitsTitle: "Límites conocidos",
  limits: [
    "El precio de catálogo es el precio de venta recomendado: cada distribuidor puede aplicar otros precios, y por ahora solo seguimos dos.",
    "Las características son las publicadas por la marca; un error suyo aparece también aquí.",
    "El historial de precios empieza en la fecha de nuestras primeras consultas (octubre de 2026).",
    "La información técnica depende de lo que publica cada marca: una marca que detalla menos sus movimientos (frecuencia, espiral, fabricante) aparece con más «no comunicado». Las familias de uso se deducen de los nombres y las características y pueden equivocarse en algunos modelos.",
  ],
});

export const METHODOLOGY: Record<Locale, MethodologyContent> = { fr, en, de, it, es };
