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

## Scraper

```bash
docker compose run --rm scraper                      # toutes les sources (long : 4 s par fiche)
docker compose run --rm scraper hamilton --limit 5   # essai sur 5 fiches
```

En essai (`--limit`), les montres non revues ne sont jamais marquées « plus produites ».

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

- `dev` : branche d'intégration. Les développements (éventuellement en parallèle) y sont fusionnés
  et testés ; chaque push produit une preview Vercel (non indexée).
- `main` : production, protégée (PR obligatoire, CI verte). Une PR `dev` → `main` valide une version ;
  sa fusion déploie automatiquement sur Vercel.
- Commits en français, préfixés (`feat:`, `fix:`, `docs:`…). Les agents de code travaillent sur la
  branche courante et ne créent ni branche, ni commit, ni PR.

## Rechargement à chaud

Docker Desktop ne transmet pas les événements fichiers de Windows/macOS au conteneur. Le service
`web` sonde donc les fichiers toutes les secondes (`NEXT_DEV_POLL_MS` dans `compose.yaml`, lu par
`next.config.ts`) : une modification apparaît en une à deux secondes, au prix d'un peu de CPU.

Plus rapide et plus léger : cloner le dépôt **dans WSL 2** (pas sur `C:`) et lancer
`docker compose up` depuis WSL. Les fichiers ne traversent plus la couche de partage et le
sondage devient inutile (`NEXT_DEV_POLL_MS` vide).

## Éditeur

Sans `node_modules` sur l'hôte, l'autocomplétion TypeScript de l'éditeur est limitée. Pour un
confort complet, ouvrez le dossier dans un Dev Container (VS Code : « Reopen in Container » en
utilisant le service `tools`), ce qui reste conforme à la règle « tout en conteneur ».
