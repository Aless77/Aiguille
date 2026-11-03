# Point de reprise

## Séquencement commun (31 octobre 2026)

Étape 1 réalisée : [bilan initial](bilan-initial.md). Parcours locaux échantillonnés vérifiés,
builds du site et de l’atelier réussis. La production reste publiquement accessible et indexable
sur la fiche examinée, contrairement au mode privé local. Collecte GitHub du 31 octobre réussie
pour les cinq marques précédentes et les deux revendeurs ; Venezianico absente de cette exécution.
Aucun déploiement ni changement distant effectué. La livraison du mode privé reste à préparer
séparément.

Étape 2 de construction réalisée : bracelet métal à pas régulier, trois rangs décalés, axes,
maillons de bout et fermoir courbe avec poussoirs et lames intérieures. Cornes du modèle cuir
effilées et plongeantes, raccord rapproché du boîtier, effilement du second brin corrigé et
tranches fermées. Fond ponctué de vis. Mode « Volumes » pour examiner la géométrie sans les
finitions. Tests du pas, de la symétrie et du regroupement des pièces ajoutés. Les ombres aident
à lire les reliefs ; aucune animation automatique ajoutée. Suite : matières, verre et lumière.

Revue finale du 1er novembre : rafraîchissement corrigé après redimensionnement et changement
de modèle hors écran. L’ancienne garde de visibilité du bloc 3D pouvait laisser le canevas vide ;
chaque changement demande désormais une seule image, même si le bloc est hors écran. L’onglet
masqué reste suspendu et aucune boucle d’animation continue n’est ajoutée. Vérifications sur
ordinateur et mobile, y compris le mode Volumes et les deux modèles. Les finitions restent
le chantier de l’étape 3 ; les plans de fabrication ne sont pas inclus.

Étape 3 — matières et lumière, 1er novembre : brossage et rugosité déterministes, faces du bracelet
coordonnées au boîtier et chants polis. Aiguilles dauphine à deux pans inclinés, cadran métallique
brossé ou mat à grain fin, cuir avec reflet satiné. Lunette profilée, réhaut fermé et glace bombée
avec transmission et réfraction ; filtrage net pour conserver les index lisibles. Les trois ambiances
changent aussi les sources réfléchies. Captures comparatives et limites dans la
[revue des matières](../apps/atelier/design-qa-etape3.md). Implémentation consultable localement ;
validation esthétique des deux rendus encore attendue avant de clore cette étape.
Contrôles locaux : `npm run check` (358 tests), build du site et build séparé de l’atelier réussis.
Revue navigateur sur ordinateur et petit écran ; aucun déploiement effectué.

Étape 4 — robustesse et performances, 1er novembre : pièces fixes regroupées par matière,
ombres réutilisées pendant la rotation, cache borné aux deux modèles et aux trois éclairages.
24 alternances vérifiées après préparation, compteurs stables (44 géométries, 15 textures,
15 programmes dans la session mesurée). Métal : 457 appels de dessin auparavant, 28 au changement
et 19 pendant la manipulation ; cuir : 343, puis 73 et 49. Budget du canevas testé à 1,5 million
de pixels, ratio plafonné à 1,75. Aucun moteur 3D ajouté au catalogue.

Interruption/restauration WebGL vérifiée par injection locale : commandes suspendues, reprise
du modèle, de la vue et de la lumière, environnements recalculés. Échec initial simulé et bouton
de relance contrôlés sur mobile ; texture du cuir volontairement invalide, montre toujours visible.
Diagnostics limités au développement. Les mesures CPU ne sont pas des FPS ; les essais en largeur
mobile ne valident pas un téléphone physique. Détails et reproduction dans le README de l’atelier.
La validation esthétique des rendus reste distincte ; ces contrôles n’autorisent aucune publication.
Validation finale : contrôle qualité Docker réussi (367 tests, dont 8 pour l’atelier), build du
site réussi sur l’état partagé du dépôt (15 021 pages), build séparé de l’atelier réussi.
Aperçu compilé vérifié au clavier, en vues normales et Volumes, en rotation/zoom, sur ordinateur
et en largeur mobile ; journal sans erreur. Serveur de contrôle temporaire arrêté, atelier normal
laissé disponible sur le port 4173. Aucun déploiement effectué.

Étape 5 — fiabilisation, 1er novembre : résumé européen corrigé pour les écarts inférieurs à
0,1 % et les ex æquo. Le calcul conserve sa précision ; les écarts arrondis à zéro sont indiqués
« ≈ 0 % » dans le tableau et les bulles, sans annoncer une économie nulle. Prix nuls et taux
invalides écartés de la comparaison. Régressions couvertes dans les cinq langues.
Textes de l'accueil, du catalogue, des nouveautés et métadonnées européens repris : plus de
restriction artificielle aux trois premières marques ni d'assimilation de tous les ajouts
à une sortie officielle de marque. Résumé et tableau restent rendus côté serveur.

Contrôle de lecture seule `scripts/bilan-local.mjs` : visiteur redirigé, API privées refusées,
ancienne administration en 404, sitemap vide et robots fermés ; pages autorisées et une fiche
parmi les neuf marques locales avec caractéristiques, JSON-LD et `noindex` dans le HTML.
La fiche Ballade utilisée dans le bilan de production n'existe pas dans cette base locale ;
la fiche Tissot Le Locle disponible a servi à la revue du tableau. Les très petits écarts sont
couverts par les tests de régression, sans créer de faux prix dans le catalogue.
Le cas réel Seiko SJE089J1 confirme la correction des ex æquo : Allemagne, France et Italie
au même prix, sans faux pays « moins cher à 0 % ». Recherche par référence sans ponctuation
et ouverture de la fiche contrôlées ; introductions et métadonnées vérifiées dans les cinq
langues, tableau lisible sur ordinateur et en largeur mobile sans débordement de page.
Un avertissement React de développement a été observé sur l'ancienne URL Ballade absente ;
pas de nouvel avertissement sur les parcours valides contrôlés ensuite. Cette vérification ne
constitue pas une recette exhaustive de toutes les routes 404 ni des connexions OAuth réelles.
Contrôles Docker : `npm run check` réussi (378 tests, dont 16 pour les prix européens),
`npm run build` réussi (16 381 pages sur l'état partagé du dépôt). Aucun changement de schéma
ou de migration dans cette correction.

Livraison toujours distincte : Vercel sert `ec2a491` (`READY`, branche `main`) ; visiteur en ligne
encore autorisé sur `/montres`, `index, follow`. La [collecte du 1er novembre](https://github.com/Aless77/Aiguille/actions/runs/41295463916)
est réussie pour les cinq marques historiques et les deux revendeurs, sans Venezianico, Lip,
Tudor ou Omega. Localement, Venezianico a 104 références avec prix ; dernier relevé : 85 montres
trouvées, 151 pages et 35 erreurs. Ce résultat n'établit pas une couverture complète.
Préparation de livraison et recette à effectuer après publication dans [deploiement.md](deploiement.md).
Aucun déploiement, lancement de collecte, commit, PR ni changement distant effectué.

Proposition de feuille de route pour articuler Aiguille et les deux modèles AV :
[feuille-de-route.md](feuille-de-route.md). Ordre proposé : état réel du site, construction
des montres, matières et lumière, robustesse 3D, fiabilisation du site, parcours commun,
comparateur, puis enrichissements optionnels. Les espaces restent techniquement séparés.
La navigation locale de l'étape 6 est préparée ci-dessous ; la publication reste à décider.

Étape 6 — parcours commun, 1er novembre : entrée « Atelier AV » dans la navigation du site,
présentation distincte des deux créations en pied de page et lien « Retour à Aiguille » dans
l'atelier. Les cinq langues du site décrivent ce parcours et précisent que l'atelier est en français.
Navigation complète par liens, sans préchargement 3D ni import du moteur dans le catalogue.
Le thème de chaque espace, les comptes et les contrôles d'accès restent indépendants.

Complément du 3 novembre : `FEATURE_ATELIER=false` masque les deux entrées dans Aiguille,
y compris le repli local en développement. Variable absente : entrées autorisées si la destination
est disponible. Changement au prochain build ou redémarrage local. Ce réglage d'affichage ne
constitue pas une protection de l'adresse directe du service autonome.

Vérification finale du 3 novembre : contrôle qualité Docker réussi (414 tests, 77 fichiers),
build du site réussi (18 986 pages sur la base locale partagée) et build distinct de l'atelier réussi.
Masquage vérifié dans le navigateur avec `FEATURE_ATELIER=false` sur un serveur temporaire :
aucun lien vers l'atelier dans l'en-tête ou le pied de page après hydratation, accès privé conservé,
journal navigateur sans erreur ni avertissement. Serveur temporaire arrêté après contrôle.
L'aller-retour activé avait été vérifié au clavier sur ordinateur et en largeur mobile le 1er novembre.
L'avertissement Vite existant sur la taille du moteur 3D reste limité au build autonome.
Aucun commit ni déploiement effectué.

En développement local, les liens conservent l'hôte pour retrouver la session du site.
Pour une publication : `ATELIER_URL` côté site et `VITE_AIGUILLE_URL` côté atelier ; HTTPS explicite,
liens masqués sans adresse, aucune adresse locale implicite dans les builds de production.
Validation Zod des destinations ; dépendance de développement déjà présente dans le monorepo,
déclarée pour la configuration Vite, sans ajout au rendu 3D. Aucun secret transmis à l'atelier.
L'hébergement et la protection d'accès distante de l'atelier restent à choisir ; son `noindex`
ne constitue pas un contrôle d'accès. Aucun déploiement effectué.

## Atelier AV (31 octobre 2026)

Première étude 3D autonome dans `apps/atelier`, accessible localement sur le port 4173 avec le
profil Docker `atelier` ; détails dans son README. Deux modèles : Obsidienne (métal) et Éclipse
(cuir), cadrans noirs, aiguilles or champagne, monogramme AV. Trois éclairages, quatre vues,
rotation et zoom manuels. Aucun déploiement et aucune intégration au catalogue.
Les images approuvées sont conservées comme références ; les proportions, microtextures,
assemblages et reflets restent à affiner avec le propriétaire avant toute animation.

Reprise du bracelet cuir : deux brins bombés et effilés, doublure, tranches teintées,
coutures arrondies, recouvrement, boucle à ardillon et passants. Texture de veau noir générée,
stockée en WebP dans l’atelier ; normales et rugosité dérivées au chargement, rendu à la demande
réactualisé après chargement. Le bracelet métal est désormais reconstruit (étape 2 ci-dessus).
La fabrication, les tolérances des articulations et la déformation portée ne sont pas validées.

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
- **Venezianico** : collecte quotidienne activée par le propriétaire (20 s entre deux fiches, fiches
  en anglais, sans autorisation de la marque : voir docs/decisions.md du 31 octobre).
- **Lip** : collecte quotidienne activée par le propriétaire malgré les restrictions des mentions
  légales, sans autorisation de la marque (voir docs/decisions.md du 31 octobre). Fiches en
  français, traductions anglaise et italienne. Tarifs de révision non publiés (devis).
- **Tudor** : catalogue collecté chez Lepage, le site officiel refusant notre robot (voir
  docs/decisions.md du 1er novembre). Prix affiché comme prix Lepage, catalogue partiel, fiches en
  français. Entretien et conseils non renseignés.
- **Omega** : 374 montres collectées en direct par exception du propriétaire, malgré l'interdiction
  des robots dans les conditions (voir docs/decisions.md du 1er novembre). Tarifs de révision et
  fabricant des calibres non renseignés.
- **Grand Seiko** : 120 montres, marque distincte de Seiko, traduites en EN, DE, IT et ES. Conseils
  d'entretien et fabricant des calibres non renseignés.
- **TAG Heuer** : catalogue collecté chez Lepage, les fiches officielles refusant notre robot (voir
  docs/decisions.md du 1er novembre). Prix affiché comme prix Lepage, catalogue partiel, fiches en
  français. Garantie, entretien et conseils non renseignés.
- **Galerie de la fiche** : toutes les photos de chaque source, glissement, miniatures, plein écran
  et zoom. Le test e2e est ignoré sur les données de test à une seule photo : il faut une montre de
  test à plusieurs photos pour qu'il s'exécute en CI.
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
