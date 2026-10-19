# Architecture

## Vue d'ensemble

```
                 GitHub Actions (cron quotidien)
                 ┌──────────────────────────┐
 Sites marques ─▶│ apps/scraper (Crawlee)   │──┐
 Revendeurs    ─▶│ un adaptateur par source │  │ écrit
 eBay, BCE…    ─▶└──────────────────────────┘  ▼
                                         PostgreSQL (Neon ou Supabase)
                                               ▲  lit (+ écrit les avis)
 Visiteurs ─▶ Cloudflare DNS ─▶ Vercel ─▶ apps/web (Next.js, rendu serveur + cache)
```

Principe : **le site ne scrape jamais**. Il lit la base, affiche, et enregistre les avis. Toute la
collecte tourne hors de Vercel (quotas, durée d'exécution, CGU de l'offre Hobby).

## Monorepo

| Paquet         | Contenu                                               | Dépend de      |
| -------------- | ----------------------------------------------------- | -------------- |
| `apps/web`     | Next.js 16 (App Router, Cache Components), Tailwind 4 | `@aiguille/db` |
| `apps/scraper` | Script Node exécuté par `tsx`                         | `@aiguille/db` |
| `packages/db`  | Schéma Drizzle, migrations SQL, client `postgres`     | —              |

Les paquets internes exportent directement leurs sources TypeScript (`"exports": "./src/index.ts"`) :
pas d'étape de build intermédiaire.

## Données

- `packages/db/src/schema.ts` est la source de vérité. `drizzle-kit generate` produit les
  migrations SQL dans `packages/db/drizzle/`, commitées et vérifiées par la CI.
- Connexion paresseuse (`getDb()`) : le build Next peut tourner sans base.
- Historique de prix : une ligne par **changement** de prix ou de stock (pas une ligne par jour).
- Modèle : `brands` → `collections` (PRX, Khaki Field) → `watches` (une référence, ses
  caractéristiques normalisées pour les filtres et `raw_specs` pour le reste) →
  `price_observations` (historique par source). `scrape_runs` journalise chaque exécution.
- Prix en centimes entiers. Une source = un identifiant (`tissot-officiel`, plus tard un par revendeur).

## Scraper

| Fichier                  | Rôle                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `sources/<revendeur>.ts` | Adaptateur revendeur (Lepage, Ocarat) : offre (prix, stock) rattachée à une montre existante par la référence |
| `sources/<marque>.ts`    | Adaptateur : `discover()` lit le sitemap, `parse()` extrait une fiche (fonction pure, testée)                 |
| `lib/listing.ts`         | Schéma Zod d'une fiche : tout ce qui n'est pas conforme est rejeté et compté en erreur                        |
| `lib/robots.ts`          | robots.txt lu avec notre User-Agent ; URL interdites écartées avant la collecte                               |
| `lib/crawl.ts`           | Crawlee : 1 requête à la fois, 4 s minimum entre deux requêtes (ou Crawl-delay), échec si zéro résultat       |
| `lib/persist.ts`         | Upsert des montres, relevé de prix seulement en cas de changement, statut « plus produite »                   |

Ajouter une source : écrire l'adaptateur et ses tests sur un extrait HTML réel, l'inscrire dans
`sources/index.ts`, compléter le registre de [sources.md](sources.md).

## Rendu et performance

- Fiches et listes : rendu serveur mis en cache (`"use cache"`, `cacheLife`), invalidé par
  `cacheTag` après chaque relevé, ou au minimum régénéré quotidiennement.
- Graphiques (ECharts, Visx) et cartes (MapLibre) : composants client chargés à la demande ; les
  chiffres clés sont aussi rendus en texte côté serveur (SEO, accessibilité).
- Filtres du catalogue dans l'URL (`nuqs`) : partageables, non indexés (voir la stratégie SEO).

## Stack retenue

Voir le tableau « Architecture et stack » du cahier des charges et [decisions.md](decisions.md) pour
les écarts et précisions.
