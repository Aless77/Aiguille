# Journal des décisions

Format : date, décision, raison. Les plus récentes en haut. Une décision ne se remet en cause que
par une nouvelle entrée qui la remplace explicitement.

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

- Base de production : Neon ou Supabase ?
- Nom de domaine (et extension `.fr` ou `.com`).
- Pays couverts : France seule, Europe, monde ?
- Site en français seul ou aussi en anglais ? (impact SEO : `hreflang`, structure `/en/`)
- Droits sur les photos de montres.
