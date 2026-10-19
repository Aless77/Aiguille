# Stratégie SEO

Le site n'a ni publicité ni budget d'acquisition : **la recherche organique est le canal principal**.
Ce document définit l'architecture, les contenus et les règles techniques qui permettent d'être
trouvé. La [checklist](checklist.md) en est la version opérationnelle, page par page.

## 1. Notre avantage à exploiter

Les sites concurrents (marques, revendeurs, magazines, forums) donnent soit un prix du jour, soit un
avis subjectif. Aiguille est le seul à publier :

- **l'historique des prix** par revendeur (plus bas, plus haut, tendance) ;
- **la disponibilité réelle** ;
- **une note sur 100 explicable**, avec méthodologie publique ;
- une **indépendance totale** (pas d'affiliation), argument de confiance.

Chaque page doit mettre en avant ces données uniques en texte lisible : c'est ce qui nous distingue
des pages minces que les moteurs déclassent.

## 2. Intentions de recherche visées

| Intention             | Exemples de requêtes                                                        | Page qui répond                                 |
| --------------------- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| Prix d'un modèle      | « prix tissot prx 40 », « hamilton khaki field mechanical prix »            | Fiche montre                                    |
| Référence exacte      | « T137.407.11.041.00 », « H70455533 »                                       | Fiche montre (référence dans le titre et le H1) |
| Avis / bon choix ?    | « tissot prx avis », « longines conquest vaut-il le coup »                  | Fiche montre (note, points forts)               |
| Comparaison           | « tissot prx vs hamilton khaki », « seiko 5 ou tissot »                     | Comparateur (paires choisies, lot 6)            |
| Sélection par critère | « montre automatique moins de 1000 euros », « montre plongée suisse 500 € » | Pages de sélection                              |
| Marque / collection   | « montres longines », « collection hamilton khaki »                         | Pages marque et collection                      |
| Nouveautés            | « nouveautés tissot 2026 »                                                  | Page Nouveautés                                 |
| Technique             | « calibre powermatic 80 », « différence quartz automatique »                | Pages calibre, guides (plus tard)               |

Le détail par lot et la méthode de recherche de mots-clés sont dans [mots-cles.md](mots-cles.md).

## 3. Architecture des URL

Règles : français, minuscules, tirets, sans accents, **stables à vie**. Pas de barre finale.

```
/                                         Accueil
/montres                                  Catalogue complet (filtrable)
/montres/tissot                           Marque
/montres/tissot/prx                       Collection
/montres/tissot/prx/t137-407-11-041-00    Fiche d'une référence
/selections/automatiques-moins-de-1000-euros   Page de sélection éditorialisée
/nouveautes                               Nouvelles références détectées
/comparer/tissot-prx-t137-407-11-041-00-vs-hamilton-khaki-field-h70455533   (lot 6, paires choisies)
/calibres/powermatic-80                   (plus tard)
/methodologie                             Comment la note et les prix sont calculés
/a-propos                                 Qui, pourquoi, contact, sources
```

- Le slug de fiche contient la **référence normalisée** : c'est souvent la requête exacte.
- Si un slug doit changer malgré tout : table d'historique des slugs et **redirection 308** de
  l'ancien vers le nouveau. Jamais de 404 sur une URL déjà indexée.
- Une montre qui n'est plus produite **garde sa page** (statut « plus produite », prix d'occasion) :
  ces pages accumulent de l'ancienneté et répondent aux acheteurs d'occasion.

### Filtres et facettes

Les filtres du catalogue (marque, prix, mouvement, diamètre) sont des paramètres d'URL gérés par
`nuqs`, partageables mais **non indexés** :

- toute URL avec paramètres a une balise canonique vers l'URL sans paramètres ;
- les combinaisons à fort potentiel deviennent de **vraies pages statiques** dans `/selections/…`,
  avec un titre, une introduction et une description propres ;
- ne jamais générer de pages pour chaque combinaison (explosion de pages minces).

Pagination : chaque page porte une canonique vers elle-même (`?page=2`), indexable, avec des liens
`<a href>` crawlables (pas seulement un bouton « charger plus »).

## 4. Contenu de chaque type de page

### Fiche montre (la page la plus importante)

| Élément                    | Contenu                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `title` (≤ 60 car.)        | `Tissot PRX 40 Powermatic 80 (T137.407.11.041.00) : prix et avis`                                                    |
| `meta description` (≤ 155) | Prix actuel le plus bas, plus bas historique, note, disponibilité : générée à partir des données                     |
| H1                         | Marque + modèle + référence                                                                                          |
| Résumé en texte            | « Prix le plus bas relevé : 595 € chez X (le 12/10). Plus bas sur 12 mois : 560 €. Note 82/100 (confiance élevée). » |
| Courbe de prix             | Composant client, mais **les chiffres clés sont aussi en HTML**                                                      |
| Tableau des offres         | Revendeur, prix, stock, date du relevé (tableau HTML)                                                                |
| Specs                      | Tableau HTML : diamètre, épaisseur, mouvement, calibre, réserve de marche, étanchéité, verre, matériaux              |
| Note sur 100               | Score, confiance, détail des 3 piliers, lien vers `/methodologie`                                                    |
| Liens internes             | Fil d'Ariane, collection, marque, montres similaires (même prix, même usage), comparaisons                           |
| Données structurées        | `Product` + `AggregateOffer` + `BreadcrumbList` (voir [donnees-structurees.md](donnees-structurees.md))              |
| Image Open Graph           | Générée (`opengraph-image.tsx`) : modèle, prix actuel, note                                                          |

**Garde-fou contenu mince** : une fiche n'est indexable (`robots: index`) que si elle a au moins les
specs principales et un prix relevé. Sinon `noindex, follow` jusqu'à ce que les données arrivent, et
elle n'apparaît pas dans le sitemap.

### Pages marque et collection

Introduction rédigée (qui, positionnement, gamme de prix observée), chiffres agrégés (nombre de
références suivies, prix médian, évolution sur 12 mois), liste des références avec liens, données
`ItemList` + `BreadcrumbList`.

### Pages de sélection

Une intention = une page. Introduction qui explique les critères, liste triée par note, mise à jour
automatique avec la date de dernière mise à jour visible. Sélections prévues au lot 2 :
automatiques moins de 500 € / 1000 € / 2000 €, plongée, chronographe, montres suisses moins de
1000 €, petits poignets (≤ 38 mm).

### Pages de confiance (E-E-A-T)

`/methodologie` (calcul de la note, sources, fréquence de relevé, limites connues),
`/a-propos` (projet non commercial, pas d'affiliation, contact), `/sources`. Elles sont liées
depuis le pied de page et depuis chaque note. Elles comptent pour les sites qui parlent d'argent et
d'achat.

## 5. SEO technique

### Déjà en place (lot 1)

- `lang="fr"`, `metadataBase`, gabarit de titre `%s | Aiguille`, description, Open Graph, Twitter.
- `robots.txt` et `<meta name="robots">` : **seule la production est indexable** (`isIndexable()`) ;
  les previews Vercel et le local renvoient `Disallow: /` et `noindex`.
- `sitemap.xml` généré par `app/sitemap.ts`.
- JSON-LD `WebSite` et `Organization` dans le layout, sérialisation protégée contre l'injection.
- `manifest.webmanifest`.
- Rendu serveur et mise en cache (Cache Components) : HTML complet pour les robots.

### À mettre en place

| Quand    | Tâche                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Lot 1    | Domaine définitif, redirection `www` → apex (Vercel), `NEXT_PUBLIC_SITE_URL` en production                                              |
| Lot 1    | Search Console + Bing Webmaster Tools, soumission du sitemap                                                                            |
| Lot 2    | Sitemap alimenté par la base (marques, collections, fiches indexables), `lastModified` = dernier changement réel (prix, stock, specs)   |
| Lot 2    | `generateMetadata` + JSON-LD sur toutes les pages catalogue ; `opengraph-image.tsx` par fiche                                           |
| Lot 2    | Pages `not-found` utiles (recherche, liens marques) avec un vrai statut 404                                                             |
| Lot 2    | Images : `next/image`, formats AVIF/WebP, dimensions explicites (CLS), `alt` descriptif (« Tissot PRX 40 cadran bleu, bracelet acier ») |
| Lot 2 ✅ | Tests Playwright SEO : `title`, canonique, JSON-LD valide et statut HTTP sur un échantillon de pages                                    |
| Lot 3 ✅ | Invalidation du cache (`revalidateTag`) après chaque relevé pour que prix et `lastmod` restent frais                                    |
| Lot 3    | IndexNow (Bing, Yandex) pour signaler les pages dont le prix a changé                                                                   |
| Lot 6    | `generateSitemaps` (un sitemap par marque) si le volume dépasse quelques milliers d'URL                                                 |
| Si EN    | Structure `/en/…`, `hreflang` réciproques, `x-default`                                                                                  |

### Performance (Core Web Vitals)

Objectifs au 75ᵉ centile, mobile : **LCP < 2,5 s, INP < 200 ms, CLS < 0,1**.

- Image principale de la fiche en `priority`, les autres en lazy.
- ECharts, Visx et MapLibre importés dynamiquement, uniquement là où ils servent, avec un espace
  réservé de taille fixe (pas de saut de mise en page).
- Polices via `next/font` (déjà en place), pas de CSS bloquant tiers.
- Pas de scripts tiers hors Turnstile (chargé seulement sur le formulaire d'avis).

## 6. Recherche par IA (moteurs génératifs)

Les réponses générées (Google AI Overviews, ChatGPT, Perplexity) citent les pages qui donnent des
faits nets et sourcés. Nos données chiffrées sont un atout :

- phrases factuelles autoportantes (« Le prix le plus bas relevé en 2026 pour la référence X est
  Y € »), dates visibles, sources citées ;
- robots d'IA autorisés par défaut (site non commercial : la visibilité prime) ; à revoir si la
  charge serveur devient un problème ;
- un `llms.txt` décrivant le site et ses pages clés, à ajouter au lot 2.

## 7. Liens entrants (netlinking)

Sans budget, les liens viennent de la valeur des données :

- données citables : « indice des prix Tissot », baisses de prix notables, nouveautés détectées
  avant tout le monde ;
- présence utile (pas de spam) sur les forums francophones (Forumamontres, Reddit r/Watches,
  r/montres) quand une question porte sur un prix ;
- graphiques intégrables avec lien source (plus tard).

## 8. Mesure et outils

| Outil                                | Usage                                       | Quand                             |
| ------------------------------------ | ------------------------------------------- | --------------------------------- |
| Google Search Console                | Indexation, requêtes, couverture, CWV réels | Dès la mise en ligne              |
| Bing Webmaster Tools                 | Idem Bing (+ IndexNow)                      | Dès la mise en ligne              |
| Vercel Speed Insights                | Core Web Vitals des vrais visiteurs         | Lot 2 (vérifier les quotas Hobby) |
| Rich Results Test / Schema Validator | Validation JSON-LD                          | À chaque nouveau type de page     |
| Lighthouse                           | Audit ponctuel (perf, a11y, SEO)            | Avant chaque fin de lot           |

Indicateurs suivis à chaque fin de lot : pages indexées / pages soumises, impressions et clics
organiques, position moyenne sur les requêtes « prix + modèle », part des URL « Bonnes » en Core Web
Vitals.

## 9. Ce qu'on ne fait pas

- Pas de texte généré en masse sans données derrière (pages minces, risque de pénalité).
- Pas de balisage `AggregateRating` à partir de notes d'autres sites (interdit par les consignes de
  Google) ; pas de notation de notre score sur 100 comme avis utilisateur.
- Pas de bourrage de mots-clés, pas de contenu caché, pas de pages par combinaison de filtres.
- Pas d'achat de liens.
