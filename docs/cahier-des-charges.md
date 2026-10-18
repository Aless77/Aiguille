# Cahier des charges – Site montres

Oct 18, 2026 · @Zab

## Objectifs

Créer un site gratuit et non commercial qui aide à choisir une montre grâce aux données : prix dans le temps, disponibilité et note calculée.

| Objectif                            | Indicateur de réussite                                            |
| ----------------------------------- | ----------------------------------------------------------------- |
| Informer sur chaque modèle          | Fiche complète (photos, specs, prix) pour chaque référence suivie |
| Montrer l'évolution des prix        | Historique quotidien, plus bas et plus haut affichés              |
| Dire si une montre est un bon choix | Note sur 100 explicable, avec niveau de confiance                 |
| Suivre l'actualité                  | Nouvelles références détectées automatiquement                    |
| Offrir une belle expérience         | Design soigné, graphiques et cartes interactifs                   |

**Public visé** : passionnés et acheteurs de montres du milieu de gamme, francophones en priorité.

## Périmètre

Six marques au départ, du milieu de gamme au haut du milieu de gamme.

| Segment              | Marques          | Ordre de démarrage                   |
| -------------------- | ---------------- | ------------------------------------ |
| Cœur du marché       | Tissot, Hamilton | Lot 1 (données les plus accessibles) |
| Milieu-haut de gamme | Longines         | Lot 1                                |
| Milieu-haut de gamme | Oris             | Lot 2 (via revendeurs)               |
| Cœur du marché       | Seiko, Citizen   | Lot 2 (sources plus difficiles)      |

| Inclus                                                     | Exclus                                 |
| ---------------------------------------------------------- | -------------------------------------- |
| Montres neuves et d'occasion des 6 marques                 | Vente ou achat sur le site             |
| Prix en euros, avec conversion des autres devises          | Publicité, affiliation, revenus        |
| Avis déposés sur le site + notes agrégées d'autres sources | Reproduction mot pour mot d'avis tiers |
| Version française                                          | Application mobile native              |

## Fonctionnalités

Le MVP couvre le catalogue, les prix et les nouveautés ; la carte, les avis et la note suivent.

| Fonction             | Ce que voit l'utilisateur                             | Priorité      | Lot |
| -------------------- | ----------------------------------------------------- | ------------- | --- |
| Catalogue            | Liste filtrable + fiche par référence (photos, specs) | Indispensable | 2   |
| Filtres partageables | Marque, prix, mouvement, diamètre dans l'URL          | Indispensable | 2   |
| Historique des prix  | Courbe par revendeur, plus bas / plus haut            | Indispensable | 3   |
| Nouveautés           | Liste des nouvelles références détectées              | Indispensable | 3   |
| Disponibilité        | Statut en stock / rupture / précommande               | Important     | 3   |
| Carte des boutiques  | Points de vente en stock sur une carte                | Important     | 4   |
| Carte par pays       | Prix moyen ou disponibilité par pays                  | Important     | 4   |
| Avis                 | Dépôt d'avis par critère, un par compte               | Important     | 5   |
| Note sur 100         | Score, niveau de confiance et détail des piliers      | Important     | 5   |
| Comparateur          | Montres côte à côte                                   | Plus tard     | 6   |
| Exploration          | Nuage de points prix vs note                          | Plus tard     | 6   |
| Alertes              | Notification de baisse de prix                        | Plus tard     | 7   |
| Analyse des avis     | Points forts / faibles extraits des textes            | Plus tard     | 7   |

## Données et sources

Toutes les sources sont gratuites ; l'historique de prix est construit par nos propres relevés quotidiens (détail dans l'[audit de faisabilité](https://claude.ai/code/artifact/f101e97b-2b54-4113-b06d-886d805339f3)).

| Donnée                            | Source principale                              | Méthode                            | Fréquence               |
| --------------------------------- | ---------------------------------------------- | ---------------------------------- | ----------------------- |
| Prix catalogue, specs, nouveautés | Sites officiels Tissot, Hamilton, Longines     | Scraping (Cheerio)                 | Quotidienne             |
| Prix neuf réel, stock             | Revendeurs FR (Ocarat, Lepage, Histoire d'Or…) | Scraping                           | Quotidienne             |
| Catalogue Seiko                   | Site Seiko (chargé en JavaScript)              | Navigateur automatisé (Playwright) | Quotidienne             |
| Calibres, specs détaillées        | WatchBase                                      | Scraping lent, pièges évités       | Mensuelle               |
| Prix d'occasion                   | API eBay Browse (gratuite, 5 000 appels/jour)  | API                                | Quotidienne             |
| Historique prix catalogue passé   | Wayback Machine                                | API archive.org                    | Une fois (à valider)    |
| Taux de change                    | BCE via Frankfurter                            | API                                | Quotidienne             |
| Adresses des boutiques            | Nominatim (OpenStreetMap)                      | API, résultat mis en cache         | Une fois par adresse    |
| Avis                              | Site + sources externes (notes agrégées)       | Formulaire + scraping              | Continue / hebdomadaire |

Règle de stockage : un nouveau relevé de prix est enregistré seulement si le prix ou le stock change.

## Contraintes

| Type                 | Exigence                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| Budget               | Proche de zéro : offres gratuites uniquement (Vercel Hobby, Neon ou Supabase, GitHub Actions)              |
| Usage                | Personnel et non commercial (condition de l'offre Vercel Hobby)                                            |
| Environnement de dev | Rien d'installé sur le PC hors Docker et Git ; tout tourne en conteneurs                                   |
| Hébergement          | Site sur Vercel ; scraping hors Vercel (GitHub Actions)                                                    |
| Domaine              | Registrar et DNS chez Cloudflare, enregistrements en « DNS only »                                          |
| Collecte             | Respect des robots.txt et CGU, 1 requête toutes les quelques secondes par domaine, User-Agent identifiable |
| Avis tiers           | Notes agrégées et lien vers la source, jamais le texte copié                                               |
| Performances         | Fiches en rendu serveur avec régénération périodique (ISR)                                                 |
| Sécurité             | Connexion requise pour un avis, anti-spam Turnstile, secrets dans des variables d'environnement            |

## Architecture et stack

&#91;embedded content: architecture · 7 composants\]

Le scraper tourne hors de Vercel, lancé chaque jour par GitHub Actions ; le site ne fait que lire la base et enregistrer les avis.

| Couche              | Choix                                                           | Alternative         |
| ------------------- | --------------------------------------------------------------- | ------------------- |
| Framework           | Next.js (App Router) + TypeScript                               | Vite + React Router |
| Style et UI         | Tailwind CSS + shadcn/ui, icônes Lucide                         | —                   |
| Animations          | Motion                                                          | —                   |
| Données côté client | TanStack Query, TanStack Table, nuqs (filtres dans l'URL)       | —                   |
| Graphiques          | Apache ECharts + Visx pour les visuels sur mesure               | Recharts            |
| Cartes              | MapLibre GL JS + react-map-gl, react-simple-maps pour les pays  | —                   |
| Base                | PostgreSQL + Drizzle ORM                                        | Prisma              |
| Formulaires et auth | React Hook Form + Zod, Better Auth                              | Auth.js             |
| Scraping            | Crawlee (Cheerio + Playwright)                                  | —                   |
| Tests et qualité    | Vitest, Testing Library, Playwright, ESLint + Prettier          | Biome               |
| Dev local           | Docker Compose (web, db, scraper, adminer)                      | —                   |
| Production          | Vercel Hobby, Neon ou Supabase, Cloudflare (DNS, Turnstile, R2) | —                   |

## Planning

&#91;embedded content: lots de livraison · 7 lots\]

Chaque lot livre quelque chose de visible en ligne ; aucune date n'est fixée à ce stade, la phase 2 reste optionnelle.

## Critères d'acceptation

Un lot est terminé quand tous ses points sont cochés et visibles en ligne.

**Lot 1 – Socle**

- [ ] `docker compose up` lance le site et la base sans rien installer d'autre
- [ ] Un push sur `main` déploie automatiquement sur Vercel
- [ ] Le domaine Cloudflare pointe vers le site, certificat SSL valide

**Lot 2 – Catalogue**

- [ ] Toutes les références Tissot, Hamilton, Longines ont une fiche
- [ ] Les filtres marque / prix / mouvement fonctionnent et restent dans l'URL

**Lot 3 – Prix**

- [ ] Le scraper tourne chaque jour sans intervention
- [ ] Chaque fiche affiche une courbe de prix et le statut de stock
- [ ] Les nouvelles références apparaissent dans la page Nouveautés

**Lot 4 – Carte**

- [ ] Les boutiques géocodées s'affichent sur la carte
- [ ] La carte par pays affiche prix moyen et disponibilité

**Lot 5 – Avis et note**

- [ ] Un utilisateur connecté dépose un avis par critère, un seul par montre
- [ ] Chaque montre affiche sa note, sa confiance et le détail des 3 piliers

**Lot 6 – Exploration**

- [ ] Le comparateur affiche au moins 3 montres côte à côte
- [ ] Les 6 marques sont couvertes

## Risques et parades

| Risque                                 | Impact                                | Parade                                                            |
| -------------------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| Un site change sa structure de page    | Le relevé de prix casse sans prévenir | Un adaptateur par source, validation Zod, alerte si zéro résultat |
| Blocage par un site (anti-robots)      | Trou dans l'historique                | Rythme lent, User-Agent clair, source de repli (revendeur)        |
| Interdiction d'usage (CGU, robots.txt) | Source inutilisable                   | Vérification avant chaque nouvelle source                         |
| Peu d'avis par montre                  | Note peu fiable                       | Moyenne bayésienne + confiance affichée                           |
| Faux avis ou spam                      | Note faussée                          | Connexion obligatoire, Turnstile, détection de doublons           |
| Dépassement des quotas gratuits        | Service coupé ou payant               | Suivi des quotas, images pré-redimensionnées, ISR                 |
| Annonce eBay disparue ≠ vendue         | Faux signal de vente                  | Ne pas présenter les disparitions comme des ventes                |

## Questions ouvertes

- [ ] Pays couverts pour la carte et les prix : France seule, Europe, ou monde ?
- [ ] Revendeurs de référence pour Oris et Citizen
- [ ] Sources d'avis externes autorisées, par marque
- [ ] Base de production : Neon ou Supabase ?
- [ ] Poids de la note (50 / 30 / 20) à valider après les premiers tests
- [ ] Site en français seul, ou aussi en anglais ?
