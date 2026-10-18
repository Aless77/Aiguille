# Journal des décisions

Format : date, décision, raison. Les plus récentes en haut. Une décision ne se remet en cause que
par une nouvelle entrée qui la remplace explicitement.

## 2026-10-18 – Catalogue et collecte (lot 2)

| Sujet              | Décision                                                                                                                        | Raison                                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base de production | **Neon**                                                                                                                        | Postgres pur, branches de base pour les previews, intégration Vercel. Auth et stockage de Supabase inutiles (Better Auth, R2).                                                               |
| Photos             | **Liens directs vers les images officielles** des marques, avec crédit et lien vers la fiche officielle                         | Meilleur rendu et SEO image. Usage non autorisé formellement : risque accepté pour un site non commercial ; retrait immédiat sur demande d'une marque.                                       |
| Extraction         | JSON-LD `Product` publié par les marques + tableau de caractéristiques HTML                                                     | Le JSON-LD sert à Google : bien plus stable que la mise en page.                                                                                                                             |
| robots.txt         | Vérifié par notre code (`robots-parser`), pas par Crawlee                                                                       | Crawlee télécharge robots.txt avec un User-Agent de navigateur, contraire à nos règles.                                                                                                      |
| En-têtes HTTP      | Générateur d'en-têtes de Crawlee désactivé, User-Agent `AiguilleBot` sur chaque requête                                         | Règle « User-Agent identifiable ». Vérifié sur serveur local.                                                                                                                                |
| Références         | Clé de rapprochement sans séparateurs (`T1374071104100`), affichage reconstitué (`T137.407.11.041.00`)                          | Rapprocher marques, revendeurs et eBay qui écrivent la référence différemment.                                                                                                               |
| Slugs              | Fixés à la création (référence), collection jamais réattribuée                                                                  | URL indexées stables.                                                                                                                                                                        |
| Montres disparues  | Statut « plus produite » seulement après une exécution complète (≥ 80 % des montres revues)                                     | Une panne ou un blocage ne doit pas tout marquer comme arrêté.                                                                                                                               |
| Interface          | shadcn/ui (style base-nova, Base UI) + Lucide ; `cn` local (clsx + tailwind-merge) plutôt que le paquet `cn` proposé par la CLI | Pas de dépendance tierce récente pour deux lignes de code.                                                                                                                                   |
| Thème sombre       | Suit la préférence du système (`prefers-color-scheme`)                                                                          | Pas de sélecteur de thème à maintenir pour l'instant.                                                                                                                                        |
| Images             | `images.unoptimized` : servies telles quelles depuis les marques                                                                | L'optimisation d'images Vercel Hobby serait épuisée par ~1 000 références. Contrepartie : PNG lourds (~2 000 px) ; à revoir (redimensionnement vers R2) si les Core Web Vitals en pâtissent. |
| Pages dynamiques   | Toutes prérendues au build (`generateStaticParams`), `notFound()` avant tout `<Suspense>`, `export const instant = false`       | Vrai statut 404 pour une URL inconnue (avec streaming : 200 + noindex, « soft 404 »).                                                                                                        |
| Textes produits    | Résumé rédigé à partir de nos données, jamais la description marketing des marques                                              | Texte protégé et dupliqué sur des centaines de sites : mauvais pour le droit et le SEO.                                                                                                      |
| Filtres            | Paramètres d'URL nuqs (`marque`, `mouvement`, `prixMin`…), rendu serveur, canonique `/montres`                                  | Partageables, sans pages en double dans l'index.                                                                                                                                             |

## 2026-10-18 – Socle technique (lot 1)

| Sujet            | Décision                                                                             | Raison                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Monorepo         | Workspaces **npm** (`apps/*`, `packages/*`), sans Turborepo                          | Aucun outil en plus ; 3 paquets seulement. Turborepo si les temps de CI l'exigent.                                          |
| Paquets internes | Exportent leurs sources `.ts` (pas de build)                                         | Simplicité ; Next et `tsx` compilent à la volée.                                                                            |
| Next.js          | 16.4 avec `cacheComponents` et `partialPrefetching`                                  | Rendu serveur mis en cache = besoin ISR du cahier des charges.                                                              |
| Linter           | ESLint 9 + `eslint-config-next` + Prettier (pas Biome)                               | Règles officielles Next (Core Web Vitals, a11y). ESLint 10 bloqué : plugins de `eslint-config-next` pas encore compatibles. |
| Tests            | Vitest à la racine, `*.test.ts` à côté du code                                       | Rapide, natif TypeScript. Playwright au lot 2.                                                                              |
| ORM              | Drizzle + driver `postgres`                                                          | Cahier des charges ; migrations SQL lisibles et versionnées.                                                                |
| Dev local        | Docker Compose ; dépendances dans des volumes Docker                                 | Contrainte « rien sur le PC hors Docker et Git ».                                                                           |
| Déploiement      | Intégration Git Vercel, Root Directory `apps/web`                                    | Previews par PR et prod sur `main` sans workflow à maintenir.                                                               |
| CI               | GitHub Actions : qualité, build, migrations + seed + scraper sur Postgres de service | Bloque les PR cassées avant Vercel.                                                                                         |
| Indexation       | Seul `VERCEL_ENV=production` est indexable                                           | Éviter que les previews soient indexées (contenu dupliqué).                                                                 |
| Langue           | Français partout (UI, docs, commits) ; identifiants de code en anglais               | Public francophone ; conventions de code universelles.                                                                      |

## Questions encore ouvertes

Reprises du cahier des charges, à trancher puis à consigner ici :

- Nom de domaine (et extension `.fr` ou `.com`).
- Pays couverts : France seule, Europe, monde ?
- Site en français seul ou aussi en anglais ? (impact SEO : `hreflang`, structure `/en/`)
- Droits sur les photos : demander l'autorisation aux services presse (liens directs en attendant).
