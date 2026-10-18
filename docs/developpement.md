# Développement

## Principe : tout tourne dans Docker

Rien n'est installé sur le poste hors Docker et Git. Les dépendances npm vivent dans des volumes
Docker (`node_modules`, `.next`) : binaires Linux, disque rapide, aucun `node_modules` sur l'hôte.

| Service   | Rôle                                                      | Port |
| --------- | --------------------------------------------------------- | ---- |
| `setup`   | `npm ci`, migrations, seed ; se termine puis libère `web` | —    |
| `web`     | `next dev` avec rechargement à chaud                      | 3000 |
| `db`      | PostgreSQL 17                                             | 5432 |
| `adminer` | Interface web de la base                                  | 8080 |
| `scraper` | À la demande (`docker compose run --rm scraper`)          | —    |
| `tools`   | Shell outil (`docker compose run --rm tools <commande>`)  | —    |

## Commandes

```bash
docker compose up                              # tout lancer
docker compose up -d && docker compose logs -f web
docker compose run --rm tools npm run check    # avant chaque push
docker compose run --rm tools npm run build
docker compose run --rm tools sh               # shell interactif dans le conteneur
docker compose down                            # arrêter
docker compose down -v                         # arrêter ET effacer base + dépendances
```

Après avoir ajouté une dépendance (`docker compose run --rm tools npm install -w @aiguille/web zod`),
committez `package.json` et `package-lock.json`. Les autres développeurs relancent `docker compose up`
(le service `setup` refait `npm ci`).

## Base de données

1. Modifier `packages/db/src/schema.ts`.
2. `docker compose run --rm tools npm run db:generate` : crée une migration SQL dans `packages/db/drizzle/`.
3. Relire le SQL généré, puis `docker compose run --rm tools npm run db:migrate`.
4. Committer schéma et migration ensemble. La CI échoue si le schéma n'a pas sa migration.

Drizzle Studio : `docker compose run --rm -p 4983:4983 tools npm run db:studio`.

## Qualité

| Outil      | Rôle                                         | Commande               |
| ---------- | -------------------------------------------- | ---------------------- |
| ESLint 9   | Règles Next (Core Web Vitals), TypeScript    | `npm run lint`         |
| Prettier   | Formatage, tri des classes Tailwind          | `npm run format:check` |
| TypeScript | Types stricts sur chaque workspace           | `npm run typecheck`    |
| Vitest     | Tests unitaires (`*.test.ts` à côté du code) | `npm test`             |

`npm run check` enchaîne les quatre. Playwright (tests de bout en bout) arrivera avec les premières
pages fonctionnelles (lot 2).

## Workflow Git

1. Branche depuis `main` : `feat/catalogue-filtres`, `fix/prix-arrondi`…
2. Commits en français, préfixés (`feat:`, `fix:`, `docs:`…).
3. PR vers `main` : la CI tourne, Vercel publie une preview (non indexée).
4. Fusion : déploiement automatique en production.

## Éditeur

Sans `node_modules` sur l'hôte, l'autocomplétion TypeScript de l'éditeur est limitée. Pour un
confort complet, ouvrez le dossier dans un Dev Container (VS Code : « Reopen in Container » en
utilisant le service `tools`), ce qui reste conforme à la règle « tout en conteneur ».
