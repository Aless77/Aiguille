# Point de reprise

## Accès privé (31 octobre 2026)

Demandes d'accès et administration réalisées dans le code ; migration `0011` appliquée localement.
Catalogue et pages de contenu réservés aux comptes approuvés ; les anciens comptes doivent aussi
faire une demande. Plus d'indexation, sitemap vide. Voir [acces-prive.md](acces-prive.md).
Avant mise en ligne : appliquer la migration de production, configurer `ADMIN_USERNAME`,
`ADMIN_PASSWORD` et `BETTER_AUTH_SECRET`, puis vérifier le parcours OAuth et la validation réelle.
Les décisions SEO précédentes sont remplacées pour ce mode privé.
Administration discrète : aucun lien public ; adresse privée définie dans `ADMIN_ACCESS_PATH`.
L'ancienne entrée `/administration` renvoie 404 sans redirection.
Correctif du mode développement : la page de demande lit les en-têtes de requête avant
d'initialiser Better Auth, pour éviter une lecture d'horloge pendant le prérendu. Les pages de
demande et de connexion administrateur ont été ouvertes sans erreur dans le navigateur local.
Connexion avec `test/test` vérifiée dans le navigateur de développement : administration,
catalogue et déconnexion fonctionnent. Un mot de passe court reste refusé hors développement local.
Validation locale : `npm run check` réussi (311 tests), build de production réussi et 6 tests
Playwright réussis sur ordinateur et mobile (visiteur bloqué, connexion/déconnexion administrateur,
demande, acceptation et révocation). Captures du formulaire et de l'administration inspectées.
Les essais créent puis suppriment leurs comptes fictifs. OAuth externe non testé dans ce parcours.

Mis à jour le 19 octobre 2026 à partir du bilan du propriétaire. Les données locales et les
services distants doivent être vérifiés avant de considérer un lot comme livré en ligne.

## État déclaré

- **Lot 1 – Socle** : monorepo npm, Next.js 16, PostgreSQL/Drizzle, Docker, qualité et CI en place.
  Projet Vercel créé ; base de production encore à connecter.
- **Lot 2 – Catalogue** : Tissot, Hamilton et Longines ; 1 573 montres annoncées dans la base locale
  (455, 292 et 826). Catalogue filtrable, fiches, marques, collections et SEO réalisés.
- **Lot 3 – Prix** : historique, stock, nouveautés, Lepage et Ocarat ; collecte quotidienne et
  invalidation du cache prévues par GitHub Actions, à vérifier en production.
- **Lot 4 – Carte** : prix dans 14 pays, conversion BCE, indice médian par rapport à la France,
  boutiques agréées Longines et Hamilton. Sans stock par boutique ; Tissot exclu conformément à
  son robots.txt. Les changements locaux du lot 4 sont à préserver.

Les lots 1 à 4 sont annoncés réalisés dans le code ; leur validation en ligne reste à faire.
Les nombres de tests et de références évoluent : utiliser les résultats des vérifications et la
base plutôt que figer ces chiffres comme critères.

## Constat en ligne (20 octobre 2026)

Site en production sur `aiguille.aless-villa.com`, avec la base locale copiée : catalogue complet
(1 573 montres, images affichées), 1 560 boutiques actives (Hamilton 1 112, Longines 448).

Reste pour boucler le lot 4 :

- **Prix étrangers** : seuls 3 modèles Tissot ont un prix hors de France (7 pays, essai limité).
  Hamilton et Longines n'apparaissent pas sur `/prix-en-europe`. La collecte quotidienne remplit
  2 pays par nuit et par marque, soit environ 7 nuits pour couvrir les 14 pays.
- **Boutiques en attente** : 2 776 Longines et 976 Hamilton pas encore visitées (400 par nuit et
  par marque), soit environ 7 nuits pour Longines.
- **Collecte quotidienne opérationnelle** depuis le 20 octobre 2026 : secrets et variables
  renseignés dans GitHub Actions et Vercel, essai manuel (`limit` = 5) réussi sur les 6 tâches,
  invalidation du cache du site confirmée. Première collecte complète la nuit suivante à 03:00 UTC.

## Lot 5 (21 octobre 2026)

- **Comptes** : Better Auth, connexion GitHub et Google (choix du compte forcé), pages
  `/connexion`, `/compte` (suppression du compte) et `/confidentialite`. GitHub actif en ligne ;
  Google à activer dans Vercel.
- **Note Aiguille** faite dans le code : sur 100, calculée dans la catégorie de la montre (gamme
  de prix × famille d'usage), à partir des faits des fiches officielles et de la base des calibres.
  Piliers mouvement 45 %, construction 30 %, rapport qualité-prix 25 %. Rang et catégorie affichés.
- **Avis de la communauté** fait dans le code : sur 5, affiché à part, un avis par compte et par
  montre (6 critères, design compris, notés par rapport au prix). Tri du catalogue par l'une ou
  l'autre note, `AggregateRating`, méthodologie. Migrations `0004` et `0005`. Modèle validé par le
  propriétaire ([decisions.md](decisions.md)).
- **24 octobre : Note Aiguille masquée** (`FEATURE_SCORE` absent ou autre que true), code conservé ;
  avis et connexion toujours affichés (masqués seulement si `FEATURE_REVIEWS=false`).
  À la place : section « Technique, garantie et entretien » et « Aussi bien équipées, pour moins
  cher » (685 montres avec au moins une alternative). Registre sourcé `brand-info.ts`, rapport
  `npm run db:couverture`, procédure [integrer-une-marque.md](integrer-une-marque.md).
  Migration `0006`.
- **Listes de souhaits et communauté** : listes privées, partagées par lien ou publiées sur
  /communaute avec avis et réponses des membres, anonymat possible, plafonds de stockage ;
  migrations `0007` et `0008` à appliquer en production (collecte
  `limit 1` ou build Vercel).
- **Venezianico** : collecte quotidienne activée par le propriétaire (10 s entre deux fiches, fiches
  en anglais, sans autorisation de la marque : voir docs/decisions.md du 31 octobre).
- **Pays de provenance** des comptes (demandé après la première connexion, `npm run db:pays`).
- **Multilingue** (FR, EN, DE, IT, ES) : routage `app/[lang]`, dictionnaires, repli anglais,
  fiches Longines traduites depuis les versions nationales. Activer avec `LANGUAGES`.
  **Tout le site est traduit** (25 octobre) : catalogue, fiche, avis, listes, communauté, compte,
  connexion, boutiques, prix en Europe, méthodologie et confidentialité (version française
  faisant foi), textes produits par `packages/db` (`i18n.ts`, testé), sitemap et hreflang prêts.
  Restent en français : messages d'erreur renvoyés par l'API, détails des piliers de la note
  (masquée), pseudonymes anonymes des listes ; `translate` pour Tissot et Hamilton. Langues
  secondaires toujours non indexées (`INDEXABLE_LOCALES`). E2E avec `LANGUAGES=fr,en,de`.
- **Reprise multilingue du 25 octobre** : travail local existant conservé (accueil, catalogue,
  filtres, pagination, nouveautés, collections, offres, historique, alternatives et libellés de
  fiche technique). Pages « À propos », « Prix en Europe » et page introuvable désormais reliées
  aux dictionnaires dans les cinq langues ; métadonnées localisées des deux pages publiques,
  pays et formats des tableaux européens adaptés à la langue. Tests supplémentaires sur les
  variables de traduction, dates, prix, pluriels et métadonnées. Restent à traduire les pages
  méthodologie, confidentialité, boutiques, connexion/compte, listes/communauté, avis et certains
  contenus techniques/entretien issus des marques ; `translate` Tissot/Hamilton reste à faire.
  Les langues secondaires restent volontairement non indexables. Aucun déploiement effectué.
  Vérifications : `npm run check` réussi (268 tests), build de production réussi avec les cinq
  langues activées (8 891 pages générées). Playwright dans Docker : 20 pages vérifiées à 1 280
  et 393 px, métadonnées, changement EN → IT, liens localisés et vraie 404 en anglais, sans erreur
  navigateur sur les parcours testés. Débordement de l'en-tête mobile corrigé : navigation sur
  une seconde ligne, sélecteur de langue accessible. Captures ordinateur/mobile relues.
- **Hydratation et Dark Reader (25 octobre)** : les trois avertissements sur les icônes montre,
  fil d'Ariane et recherche ont été reproduits en simulant les attributs de l'extension avant
  l'hydratation. Cause : verrou diffusé trop tard via `generateMetadata`. Verrou déplacé dans le
  `<head>` initial du layout ; aucune suppression d'avertissement ajoutée sur les composants.
  Même simulation après correction : aucun SVG modifié, aucun avertissement d'hydratation ;
  recherche interactive vérifiée. Test de régression sur l'ordre du HTML ajouté au parcours catalogue.
- **Déclinaisons** : sélecteur de cadrans, matières, bracelets et tailles du même modèle sur la
  fiche (Tissot, Longines, Hamilton), regroupé par la référence (`variants.ts`), une rangée
  visible et la suite repliée.
- **Gammes officielles** : Longines (5 univers), Tissot (7 collections emblématiques), Hamilton à
  plat ; page marque, page collection et fiche (`collection-families.ts`).
- **Fiche technique commune** : mêmes rubriques et lignes pour toutes les marques, « Autres
  informations » pour le reste ; remplissage ligne par ligne dans `npm run db:couverture`.
- Garantie, tarifs et conseils d'entretien relevés pour Longines et Hamilton (24 octobre).
- Tarifs et conseils Tissot complétés le 24 octobre : grilles mécanique/quartz/chronographe et
  tactile, liens officiels, exclusions, fréquences divergentes signalées. Forfaits vintage exclus ;
  solaire non extrapolé ; restriction du forfait pile Longines affichée.
- Reste à sourcer : fabricants de mouvements, calibres Tissot (absents des fiches). Longines : garantie
  (sur chaque fiche) et tarifs de révision relevés le 24 octobre.
- Hamilton refuse nos requêtes depuis le poste local (403, Akamai) et ses images s'y affichent
  « Photo indisponible » ; la collecte GitHub passait encore le 21 octobre. À surveiller.
- Plus tard : clés Turnstile si les avis sont réactivés, notes externes, cote en occasion (eBay).
- Vérification locale entretien (24 octobre) : contrôle qualité et build de production réussis ;
  10 parcours Playwright réussis (ordinateur/mobile, trois marques, liens et navigation vers la
  garantie). Captures Tissot relues. Léger débordement horizontal de l'en-tête à 393 px, hors du
  bloc entretien, à corriger séparément. Aucun déploiement effectué.

## Prochaine étape : mise en production

Recherche du 24 octobre : barre par nom/référence et curseurs prix/diamètre sur le catalogue,
les marques et les collections ; URL partageable, pagination dans le même périmètre, filtres
non indexés. Validation locale de la recherche, des références sans ponctuation, des bornes,
du clavier, de l'ouverture mobile, de la remise à zéro et des vrais 404. Code non déployé.

Déploiement du 24 octobre (`ad8ea95`, PR #20) en échec : `watch_scores` absente de la base
de production. Correction préparée dans `dev` : migrations avant le build Vercel de production
(`apps/web/vercel.json`), arrêt en cas d'échec ; previews sans migration automatique.
Commande exacte validée dans Docker (migrations puis build). Après commit/push et fusion par le
propriétaire, vérifier le nouveau déploiement Vercel. Aucune base distante modifiée par l'agent.

Suivre [deploiement.md](deploiement.md) et les choix de [decisions.md](decisions.md).

1. Connecter Neon au projet Vercel ; préparer le transfert de la base locale lorsque l'URL sera
   disponible dans `.env.neon` (fichier local ignoré par Git). Ne jamais afficher l'URL ou les secrets.
2. Configurer le sous-domaine prévu `aiguille.aless-villa.com` dans Vercel et chez Cloudflare,
   avec les valeurs DNS indiquées par Vercel et le mode « DNS only ».
3. Renseigner les variables et secrets de Vercel et de GitHub Actions, puis vérifier la collecte
   et le rafraîchissement du site.
4. Vérifier les CGU des sources et les critères d'acceptation des lots en ligne, dont le SEO.

Le propriétaire gère les commits, PR et fusions. Les agents restent sur la branche courante.

## Citizen et Seiko – intégration locale du 25 octobre 2026

- **Catalogue** : 148 Citizen (148 URL françaises) et 447 Seiko (463 URL candidates), en plus
  des 1 573 montres existantes. Source officielle en HTML ; prix présents pour 148 Citizen et
  428 Seiko. Les fiches sans prix restent utiles et non indexables. Aucun changement de schéma.
- **Fonctions communes** : marques/collections/fiches, recherche et filtres, historique des prix,
  offres revendeurs, nouveautés, garanties et entretien, alternatives et calcul des notes.
  Citizen : déclinaisons établies par les liens officiels ; Seiko : aucun regroupement supposé.
  Navigation adaptée aux cinq marques. Oris retirée des pages publiques et du seed ; sa ligne
  vide historique reste conservée en base, sans contenu affiché.
- **Collecte quotidienne configurée** : France, prix nationaux disponibles, traductions
  officielles en rotation. Citizen : France/Allemagne pour les prix, anglais/allemand pour les
  traductions ; Seiko : France/Allemagne/Italie/Espagne/Royaume-Uni, quatre langues secondaires.
  Les essais de langues et de pays portent sur de petits lots : la couverture complète se
  remplira progressivement après activation du workflow contenant ces modifications.
- **Fiabilité** : références complètes, rejets des fausses fiches et des redirections vers une
  autre référence ; solaire conservé en jours/mois, sans conversion en heures mécaniques.
  Type Citizen « Mécanique » seul : remontage non déterminé, jamais supposé manuel.
- **Limites sourcées** : stock officiel Seiko inconnu, boutique protégée non collectée ; pas de
  stock par boutique ni de nouvelles adresses agréées pour ces deux marques. Couleur du cadran
  absente des tableaux collectés ; matériau du bracelet Seiko souvent non publié. Fabricant du
  mouvement, fabrication et tarifs de révision non établis : non communiqué, sans extrapolation
  à toute la marque. Rapport `db:couverture` exécuté après le relevé complet.
- **Périmètre de livraison** : code et base locale uniquement ; aucun déploiement, aucune
  écriture sur la base distante et aucune invalidation du site de production.
- **Vérifications** : `npm run check` réussi sur l'état partagé du dépôt (293 tests), build
  de production réussi avec FR/EN/DE/IT/ES (12 011 pages). Playwright dans Docker, plugin Browser
  absent : 24 pages vérifiées à 1 280 et 393 px, recherche Citizen, déclinaisons, fiche solaire
  (180 jours), référence Seiko complète et offre Lepage, traductions Seiko dans les quatre
  langues secondaires, Oris en vraie 404. Aucun débordement ni erreur d'hydratation sur ces
  parcours ; captures relues. Prix/specs et JSON-LD Product confirmés dans le HTML serveur ;
  sitemap avec Citizen/Seiko, sans Oris. Essais de prix étrangers : Citizen DE (5/5) ; Seiko
  DE/IT/GB (2/5 chacun), ES (1/5), les autres fiches absentes/inexploitables sur ces marchés.
  Traductions indépendantes : Citizen EN/DE (5/5 chacun), Seiko EN (2/5, trois absences).
  La totalité des références et langues étrangères n'a pas été collectée pendant cette validation.

## Ensuite

- **Décision du 25 octobre : Citizen et Seiko retenues, Oris écartée.** Oris ne doit plus être
  annoncée sur le site. Ses conditions publiées interdisent la réutilisation du contenu sur un
  autre site ; aucune demande ni aucun refus individuel reçus. L’étude ci-dessous reste
  historique ; son étape Oris est annulée. Voir [decisions.md](decisions.md).

- **Étude historique nouvelles marques (25 octobre, avant intégration)** : ordre demandé Citizen → Oris → Seiko. Analyse et
  plan d’intégration dans [analyse-citizen-oris-seiko.md](analyse-citizen-oris-seiko.md), registre
  des sources complété. Citizen : 148 URL produits françaises, clés techniques pour traductions,
  autonomie solaire à traiter sans confusion jours/heures. Oris : source officielle techniquement
  exploitable mais CGU restrictives, autorisation ou source revendeur à établir. Seiko : prix et
  caractéristiques accessibles en HTML sur l’échantillon, vigilance sur les références complètes
  et les fausses 404 en HTTP 200 ; boutique protégée en local. Aucune nouvelle source activée,
  aucune montre importée pendant l’étude. Prochaine étape : adaptateur Citizen sur un petit lot,
  après clarification de la réutilisation des contenus, puis faits/fiche technique, traductions,
  déclinaisons, revendeurs et validation de tous les parcours existants.

- **Lot 5** : comptes, anti-spam, avis par critère et note explicable sur 100. Sources externes
  autorisées et poids des trois piliers encore à trancher.
- **Lot 6** : comparateur, exploration prix/note ; Citizen et Seiko intégrées localement ci-dessus.
- **Lot 7**, optionnel : alertes de baisse de prix et analyse des avis.

Pour les messages de console liés aux extensions et à Docker, voir
[le diagnostic de développement](developpement.md#messages-de-console-du-navigateur).
