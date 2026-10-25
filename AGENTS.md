# AGENTS.md – règles pour les agents de code (Claude Code, Codex, Cursor…)

Aiguille est un site **gratuit et non commercial** qui aide à choisir une montre grâce aux données :
prix dans le temps, disponibilité, note calculée. Le besoin complet est dans
[docs/cahier-des-charges.md](docs/cahier-des-charges.md) : lisez-le avant toute fonctionnalité.

Langue du projet : **français** (interface, docs, commentaires, messages de commit, PR).
Les identifiants de code restent en anglais (`getPriceHistory`, `brands`).

Nouvelle marque : suivre [docs/integrer-une-marque.md](docs/integrer-une-marque.md) (faits
techniques, garantie, couverture des données). Point de reprise : [docs/suivi.md](docs/suivi.md) (état déclaré des lots, prochaine étape et
vérifications restantes). Les règles communes restent ici ; `CLAUDE.md` les référence pour Claude
Code. Conserver les fichiers et les modifications des autres agents.

## Carte du dépôt

| Dossier        | Rôle                                                                 |
| -------------- | -------------------------------------------------------------------- |
| `apps/web`     | Site Next.js (App Router), déployé sur Vercel                        |
| `apps/scraper` | Relevés quotidiens (Crawlee), lancés par GitHub Actions, hors Vercel |
| `packages/db`  | Schéma Drizzle, migrations, client PostgreSQL partagé                |
| `docs/`        | Architecture, déploiement, sources, SEO, décisions                   |

Workspaces npm : une seule commande `npm ci` à la racine installe tout.

## Commandes : toujours dans Docker

Le poste n'a que Docker et Git (contrainte du cahier des charges). **N'installez rien sur l'hôte et
ne lancez pas `npm` directement sur l'hôte.** Passez par le conteneur `tools` :

```bash
docker compose up                                  # site (3000), base (5432), Adminer (8080)
docker compose run --rm tools npm run check        # lint + format + types + tests
docker compose run --rm tools npm run build        # build de production
docker compose run --rm tools npm run db:generate  # après modification de schema.ts
docker compose run --rm tools npm run format       # corrige le formatage
docker compose run --rm scraper                    # lance le scraper
```

Avant de rendre la main, `npm run check` **et** `npm run build` doivent passer : la CI les relance
sur chaque PR ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Next.js 16 : ne vous fiez pas à votre mémoire

La version installée a des API différentes de vos données d'entraînement (Cache Components,
`proxy.ts` au lieu de `middleware.ts`, `LayoutProps`/`PageProps` globaux, etc.). Avant d'écrire du
code Next, lisez le guide correspondant dans `node_modules/next/dist/docs/` (dans le volume Docker :
`docker compose run --rm tools ls node_modules/next/dist/docs/01-app`). Voir aussi
[apps/web/AGENTS.md](apps/web/AGENTS.md), dont un bloc est géré automatiquement par `next dev`.

`cacheComponents` est activé : toute donnée non mise en cache doit être sous `<Suspense>` ou marquée
`"use cache"` avec `cacheLife`/`cacheTag`. Les lectures du catalogue sont dans
`apps/web/src/lib/catalog/queries.ts` (profil `hours`, étiquette `catalog`).

Langues : toutes les pages sont sous `apps/web/src/app/[lang]` (français sans préfixe, réécrit par
`proxy.ts`). Liens internes avec `Link` de `@/lib/i18n/client` (jamais `next/link`), écrits sans
préfixe ; textes affichés tirés de `getDictionary()` (`lib/i18n/dictionaries`, français et anglais
complets). Voir docs/decisions.md (25 octobre 2026).

Pages dynamiques indexables (marque, collection, fiche) : même gabarit partout.

- `generateStaticParams` renvoie toutes les pages connues, via `withPlaceholder` (base vide = build OK).
- `await params` puis `notFound()` **avant** tout `<Suspense>` (vrai 404), et `export const instant = false`.
- `generateMetadata` via `pageMetadata()` ; JSON-LD via `<JsonLd>` ; fil d'Ariane via `<Breadcrumbs>`.

## Conventions de code

- TypeScript strict, pas de `any` ; valider toute donnée externe avec Zod (scraping, formulaires, API).
- Imports de types : `import { type X }` (règle ESLint). Alias `@/` = `apps/web/src`.
- Composants serveur par défaut ; `"use client"` seulement pour l'interactivité (graphiques, cartes, filtres).
- Tests Vitest à côté du code : `foo.ts` → `foo.test.ts`. Toute logique de calcul (note, prix,
  normalisation de références) est testée.
- Formatage : Prettier (100 colonnes, guillemets doubles, classes Tailwind triées). Ne pas débattre du style.
- Base : toute modification de `packages/db/src/schema.ts` s'accompagne d'une migration générée et
  commitée (`packages/db/drizzle/`). Ne jamais éditer une migration déjà fusionnée.
- Slugs publics (marques, montres) : **immuables** une fois en ligne (ils sont dans les URL indexées).

## SEO : obligatoire sur chaque page publique

Le référencement est un objectif de premier rang. Avant d'ajouter ou modifier une page, appliquez
[docs/seo/checklist.md](docs/seo/checklist.md). En résumé :

- `generateMetadata` avec `title` unique, `description` utile, `alternates.canonical`.
- Données structurées JSON-LD via `JsonLd` (`apps/web/src/lib/seo/json-ld.tsx`).
- Contenu essentiel (prix, specs, note) **présent dans le HTML serveur**, pas seulement dans un
  graphique client.
- URL en français, minuscules, avec tirets, stables ; filtres en paramètres d'URL non indexés.
- Page ajoutée au sitemap si elle doit être indexée.
- Seule la production est indexable (`isIndexable()`) : ne contournez jamais ce garde-fou.

Stratégie complète : [docs/seo/strategie.md](docs/seo/strategie.md).

## Collecte de données : règles non négociables

Voir [docs/sources.md](docs/sources.md). Respect de robots.txt et des CGU, 1 requête toutes les
quelques secondes par domaine, User-Agent identifiable (`SCRAPER_USER_AGENT`), jamais de texte d'avis
tiers copié (seulement note agrégée + lien). Un nouveau relevé n'est stocké que si le prix ou le stock change.

## Git et PR

- Travailler sur la branche courante (en général `dev`). **Ne pas créer de branche, de commit ni de
  PR, ne rien fusionner** : le propriétaire du dépôt s'en charge. `main` = production, protégée,
  alimentée par des PR `dev` → `main`.
- Messages de commit en français, à l'impératif, préfixés (Conventional Commits) :
  `feat: fiche montre`, `fix: …`, `docs: …`, `chore: …`, `refactor: …`, `test: …`, `ci: …`.
- Une PR = un sujet. Remplir le modèle de PR (cases SEO et sources comprises).
- Secrets : uniquement dans les variables d'environnement (Vercel, GitHub), jamais dans le dépôt.
  `.env.example` documente chaque variable.

## Décisions déjà prises

Consigner toute décision structurante dans [docs/decisions.md](docs/decisions.md) (date, choix,
raison). Ne pas revenir sur une décision sans le signaler.
