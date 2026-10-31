# Journal des décisions

Format : date, décision, raison. Les plus récentes en haut. Une décision ne se remet en cause que
par une nouvelle entrée qui la remplace explicitement.

## 2026-10-31 – Site privé sur demande

Pour les essais du propriétaire, `test/test` est accepté dans le serveur de développement local
(`NODE_ENV=development`, hors Vercel). Le minimum de 16 caractères reste requis ailleurs.
Une configuration invalide affiche désormais une explication distincte des identifiants incorrects.

Précision du propriétaire : l'administration n'a aucun lien ni bouton d'entrée sur le site.
Son adresse est définie uniquement dans `ADMIN_ACCESS_PATH`, sans chemin par défaut.
L'entrée `/administration` mentionnée dans l'implémentation initiale est remplacée : elle renvoie
désormais 404 sans révéler l'adresse configurée. Identifiant et mot de passe restent requis.

À la demande du propriétaire, l'intégralité du catalogue et des pages de contenu devient privée.
Cette décision remplace l'ouverture publique et l'objectif SEO précédents : sitemap vide,
exploration interdite et indexation désactivée, y compris en production.
Les comptes Google/GitHub sont conservés, mais sans autorisation implicite, même s'ils existaient
déjà. Une demande décrit les motivations, la provenance et les marques souhaitées.
Le propriétaire accepte ou refuse dans `/administration`, avec identifiant et mot de passe définis
dans les variables privées. Aucun compte administrateur par défaut ni envoi d'e-mail ajouté.
La décision est consultable sur `/demande-acces` ; elle reste modifiable par l'administrateur.
Les exceptions nécessaires à la connexion, la confidentialité et l'effacement du compte restent
accessibles. Configuration et limites : [acces-prive.md](acces-prive.md).

## 2026-10-25 – Citizen et Seiko intégrées, Oris écartée

Le propriétaire retient Citizen et Seiko et demande de retirer Oris du site. Ce choix remplace
le périmètre initial de six marques : cinq marques retenues, avec Tissot, Hamilton et Longines.
Oris reste uniquement dans les notes historiques. Son intégration est écartée car les
[conditions d’utilisation publiées par Oris, section 2](https://www.oris.ch/fr-FR/terms-use)
interdisent la réutilisation et la présentation du contenu sur un autre site. **Aucune demande
d’autorisation n’a été envoyée et aucun refus individuel n’a été reçu.** Les données d’un
revendeur ne suffisent pas à lever les questions de droits et d’exactitude identifiées dans l’étude.
La ligne de marque vide éventuellement déjà semée est conservée en base, exclue de l’affichage
et des nouvelles installations ; aucune suppression de données n’est nécessaire.

Citizen et Seiko : extraction des faits des pages officielles en HTML, sans appel aux API
interdites et sans description commerciale recopiée. Les images restent des liens directs,
selon le choix déjà consigné pour les marques existantes. Les conditions de réutilisation
restent documentées dans le registre des sources ; aucune autorisation spécifique n’est revendiquée.

- Citizen : périmètre français du sitemap du distributeur officiel, références complètes,
  caractéristiques par identifiant de ligne et déclinaisons établies par les liens du sélecteur.
- Seiko : fiches françaises du sitemap officiel, validation du contenu pour écarter les fausses
  404 en HTTP 200, référence complète distincte du H1 abrégé, prix national lu dans le HTML.
  La disponibilité reste inconnue sur le catalogue institutionnel. La boutique protégée n’est
  pas collectée ; aucun contournement du 403.
- **Autonomie solaire** : conserver la valeur et son unité dans `rawSpecs`, l’afficher dans la
  fiche technique ; ne pas remplir `powerReserveH`, réservé aux heures de réserve mécanique
  pour ces deux adaptateurs. Un filtre sur les heures de réserve ne doit pas interpréter 180
  jours comme 180 heures. Pas de modification du schéma ni de conversion approximative des mois.
- **Langue et marché** : collecte `--traductions en,de,it,es` indépendante des prix, lorsqu’une
  version officielle existe. `auto` relève une langue par nuit, avec rotation ; l’anglais
  européen Citizen ne devient pas un prix britannique. Les langues absentes gardent le repli
  explicite existant. Pas de traduction générée des valeurs des marques.
- **Déclinaisons** : un lien explicite du site constructeur peut compléter les motifs de
  référence existants ; aucun regroupement Seiko par simple préfixe ou calibre.
- **Fiabilité des fiches** : une redirection vers une autre référence est refusée pour les prix
  nationaux et traductions. Les faits techniques sont reconnus depuis le pivot français, même
  lorsque les valeurs affichées proviennent d'une autre langue officielle. Chez Citizen,
  « Mécanique » seul ne prouve pas un remontage manuel ; la mention Eco-Drive dans les
  caractéristiques suffit à identifier le solaire. Les dimensions nulles ou hors des bornes
  admises restent dans les données brutes sans invalider toute la fiche.
- Tarifs d’entretien et pays de fabrication non établis : « non communiqué ». Garantie
  internationale Citizen/Seiko : trois ans selon les conditions sourcées ; garantie d’une
  révision complète Seiko : un an. Les intervalles spécifiques d’un calibre ne sont pas
  étendus à toute la marque.

## 2026-10-25 – Gammes officielles au-dessus des collections

Les collections sont regroupées en gammes uniquement quand la marque le fait sur son site,
relevé le 25 octobre (`collection-families.ts`) : Longines en cinq univers de son menu (Master,
Conquest, Spirit, Elegance, Heritage, toutes collections couvertes) ; Tissot par ses « collections
emblématiques » qui réunissent plusieurs lignes (PRX, PR 100, Seastar, Le Locle, Supersport
Chrono, T-Race, XL), membres vérifiés page par page, les autres lignes restant autonomes ;
Hamilton à plat. Pas de nouvelle URL ni de migration : la gamme s'affiche sur la page marque
(ancre `#gamme-…`), sur la page collection (collections sœurs) et dans l'en-tête de la fiche.
PR100 Sport Chic et PR100 Vuelta n'apparaissent pas sur la page PR 100 : non rattachées.

Page marque : un menu « Explorer les N collections », replié par défaut ; dedans, chaque gamme est repliée (nom, nombre de collections et de modèles, prix
d'entrée, aperçu) et se déplie au clic ; un lien `#gamme-…` l'ouvre directement. Chaque collection
montre une montre d'exemple **fixe** (la moins chère en vente avec photo) plutôt qu'aléatoire :
pages en cache, pas de saut d'image, même repère visuel d'une visite à l'autre.

Le sélecteur de déclinaisons affiche une rangée de six vignettes, la suite étant repliée
(« Voir les N autres déclinaisons »), la déclinaison ouverte restant toujours visible.

## 2026-10-25 – Listes de souhaits et communauté

Un compte peut créer des listes de souhaits (20 au plus, 50 montres chacune) depuis la fiche d'une
montre (« Ajouter à une liste ») ou la page « Mes listes ». Trois visibilités : **privée** (par
défaut), **partagée par lien** (lisible sans compte par qui a l'URL) et **publiée dans la
communauté** (page /communaute, ouverte aux avis des membres). L'URL d'une liste porte un
identifiant aléatoire de 12 caractères (environ 60 bits), jamais l'identifiant en base : une liste
« par lien » ne peut pas être devinée. Migration `0007`.

- **Forum** : /communaute liste les listes publiées, la plus récemment active en premier. Les
  membres connectés y laissent un avis sur la liste ou sur l'une de ses montres. Mêmes garde-fous
  que les avis de montres : connexion, Turnstile si configuré, liens refusés, plafonds détaillés
  ci-dessous. L'auteur d'une liste masque les avis reçus ; chacun supprime les siens.
- **Non indexé** (listes, communauté, « Mes listes ») : contenu des membres, modération encore
  manuelle. À revoir quand le volume et la modération le justifieront.
- **Cache** : chaque liste est en cache par son étiquette et invalidée immédiatement à chaque
  modification (`expire: 0`). Les droits du visiteur (auteur, ses avis) sont lus côté navigateur.
- **Interrupteur** `FEATURE_COMMUNITY` : affiché par défaut, masqué seulement avec « false ».
- Suppression du compte : listes, montres des listes et commentaires effacés en cascade.
- **Anonymat** (migration `0008`) : une liste peut être publiée anonymement (« Auteur de la
  liste », sans nom ni photo) ; un membre peut écrire sous **pseudonyme propre à chaque liste**
  (HMAC du secret serveur, de la liste et du compte : « Balancier ambre 27 »). Stable dans une
  discussion, différent d'une liste à l'autre, impossible à relier au compte sans le secret.
  Choix **à chaque message**, avis comme réponse (case « Écrire anonymement », préremplie avec
  le choix du dernier message). Remplace le choix fixé par liste (demande du 25 octobre) : rien ne
  relie techniquement un pseudonyme aux messages signés du même compte ; seul le pseudonyme sort
  du serveur. L'auteur d'une liste peut répondre sans son nom (« Auteur de la liste ») ; sur une
  liste anonyme, il reste toujours anonyme.
- **Réponses** : un niveau de discussion. Les messages de l'auteur de la liste portent partout
  le badge « Auteur de la liste ». Un avis supprimé par son auteur laisse ses réponses en place.
- **Plafonds de stockage** (Neon gratuit, 0,5 Go) : par compte 20 listes, 50 montres par liste,
  30 messages par jour, 40 par liste, 500 au total ; 300 messages par liste (discussion close
  au-delà) ; pour le site 20 000 listes, 200 000 montres en liste, 50 000 messages, soit environ
  60 Mo au pire. Au-delà, création suspendue avec un message clair. À relever si on change
  d'offre.

## 2026-10-25 – Pays de provenance des comptes

À la création du compte (connexion GitHub ou Google, sans formulaire d'inscription), une petite
fenêtre demande le pays de provenance : liste des 249 pays ISO, « Ne pas préciser » possible,
modifiable sur /compte. Seul le code pays est stocké (`users.country`, `ZZ` pour « ne pas le
dire »), jamais d'adresse ; validé côté serveur (hook Better Auth). Usage : statistiques par pays
(`npm run db:pays`, sans donnée individuelle). Mentionné dans la page Confidentialité.

## 2026-10-25 – Site multilingue (FR, EN, DE, IT, ES)

- **URL** : le français garde ses URL (déjà indexées) ; les autres langues ont un préfixe et les
  mêmes chemins (`/en/montres/tissot/prx/…`). Toutes les pages sont sous `app/[lang]` ; le proxy
  réécrit les URL sans préfixe vers `/fr`, redirige `/fr/…` vers l'URL sans préfixe et répond 404
  pour une langue non publiée. Liens internes écrits sans préfixe : `Link` de `@/lib/i18n/client`
  ajoute celui de la langue affichée.
- **Publication** : variable `LANGUAGES` (français seul par défaut). Langues hors français en
  `noindex` (`INDEXABLE_LOCALES`) tant que tout le site n'est pas traduit.
- **Textes du site** : dictionnaires TypeScript (`lib/i18n/dictionaries`). Le français fait
  référence, l'anglais doit être complet (vérifié par TypeScript), les autres peuvent être
  partiels : les manques s'affichent en anglais avec un avertissement refermable.
- **Fiches des marques** : chaque version nationale déjà relevée pour les prix (DE, IT, ES, GB)
  sert aussi de traduction, sans requête de plus (`watch_translations`, valeurs rangées par clé
  stable, la version française servant de pivot). Langue absente : version anglaise, puis
  française, avec un avertissement sur la fiche. Longines d'abord (`translate` de l'adaptateur).
- **Traduit** : tout le site depuis le 25 octobre (voir docs/suivi.md pour les exceptions). Textes
  de l'interface dans `lib/i18n/messages/*.ts` (un fichier par thème, cinq langues côte à côte),
  pages longues dans un module `content.tsx` à côté de la page, textes produits par `packages/db`
  (fiche technique, informations de marque, conseils, comparaisons) dans `packages/db/src/i18n.ts`,
  dont un test exige la traduction de chaque texte de marque. Confidentialité : la version
  française fait foi.
- **Indexation** : passer une langue dans `INDEXABLE_LOCALES` suffit (hreflang et sitemap suivent).
  À faire quand les fiches des marques sont collectées dans cette langue.

## 2026-10-25 – Sélecteur de déclinaisons sur la fiche montre

Comme sur les sites des marques, la fiche propose les déclinaisons du même modèle (cadran,
boîtier, bracelet) en vignettes, et ses autres tailles en pastilles. Regroupement par la partie
« modèle » de la référence, propre à chaque marque (`MODEL_KEYS` : `T137.407` chez Tissot,
`L2.893` chez Longines, `H32705` chez Hamilton), plutôt que par le nom, écrit de façon irrégulière
(« 42mm », « 42 mm », espaces doublés). Les tailles rapprochent les modèles de même nom une fois la
taille retirée. Chaque choix est un lien vers sa propre fiche : rendu serveur, aucune URL nouvelle,
chaque déclinaison reste indexable. Les pièces vintage (références sans motif) n'ont pas de
sélecteur. Les déclinaisons déjà proposées sont retirées de « Autres modèles ».

## 2026-10-24 – Recherche et filtres communs au catalogue, aux marques et aux collections

Un même composant serveur présente les résultats et la pagination dans les trois niveaux.
La recherche porte sur le nom, la marque, la collection et la référence ; chaque mot doit
correspondre. Les références sont aussi cherchées sans ponctuation, sans tenir compte de la casse.
Les numéros de série individuels ne sont pas recherchés. Les motifs SQL sont paramétrés et les
jokers saisis sont traités littéralement ; longueur de recherche limitée à 120 caractères.

Prix et diamètre disposent de curseurs à deux poignées, avec saisie numérique complémentaire.
Leurs bornes viennent de la marque ou collection consultée. La recherche se met à jour après une
courte pause de saisie ; les curseurs ne relancent la requête qu'au relâchement. Les diamètres
décimaux sont conservés. Toute modification ramène à la première page.

Les paramètres restent dans l'URL ; la pagination conserve le chemin de marque ou de collection.
Le périmètre du chemin prime sur un éventuel paramètre de marque contradictoire. Les collections
sont désormais paginées, avec vrais liens et contenu serveur. Sur une page de marque, les liens
des collections restent accessibles dans « Explorer les collections », replié pour laisser la
recherche directement accessible. Sur mobile, seule la recherche est toujours ouverte.

Les variantes filtrées ou paginées sont en `noindex,follow`, avec canonique sans paramètres.
Les URL publiques existantes, le sitemap, les vrais 404 et le garde-fou d'indexation sont conservés.

## 2026-10-24 – Appliquer les migrations avant le build Vercel de production

Le déploiement de `ad8ea95` (PR #20) échoue pendant le prérendu : PostgreSQL signale
`relation "watch_scores" does not exist`. La migration `0004` crée cette table, puis `0005`
et `0006` la complètent. La base locale est migrée, contrairement à la base lue par ce build.

La commande Vercel de production exécute désormais les migrations commitées avant le build,
et s'arrête immédiatement en cas d'échec. Cette décision complète le déclenchement nocturne :
un déploiement n'attend plus la collecte suivante pour disposer du schéma nécessaire.
Ni seed ni recalcul des notes pendant le build. Les previews ne migrent pas automatiquement :
elles doivent utiliser une base dédiée déjà préparée. Aucune migration existante n'est modifiée.

## 2026-10-24 – Complément entretien Tissot et périmètre des forfaits

Cette vérification complète le relevé ci-dessous : les pages Tissot sont désormais lisibles.
[Tarifs France](https://www.tissotwatches.com/fr-fr/service-prices) : révision complète
quartz 120 / 185 € (simple / chronographe), mécanique 195 / 290 €, écran tactile 295 € ;
partielle respectivement 55 / 65 €, 55 / 70 € et 70 €. Tarifs indicatifs, diagnostic préalable.
La pile est incluse dans le service partiel des modèles à pile, sans tarif isolé publié.

Le lien de détail pointe vers la [page garantie et entretien Tissot](https://www.tissotwatches.com/fr-fr/customer-service-warranty.html),
avec exclusions et conseils. La FAQ confirme 3 ans pour COSC et Lightmaster, sans étendre cette
durée à tous les solaires. Les recommandations contradictoires sont affichées avec leurs sources :
[FAQ](https://www.tissotwatches.com/fr-fr/faq), révision tous les 4 à 5 ans ; page garantie,
contrôle tous les 3 à 4 ans. Le manuel du modèle et le diagnostic du centre agréé priment.

Les forfaits courants ne sont pas appliqués aux pièces vintage ni extrapolés aux solaires.
Les T-Touch utilisent leur grille tactile. Les pièces vintage reçoivent un conseil d'évitement
de l'eau et une indication de devis. Le tarif Longines de 35 € inclut contrôle d'étanchéité et
pile, uniquement dans les boutiques de Sèvres et Saint-Honoré
([source officielle](https://www.longines.com/fr/customer-service/services/maintenance-prices)).
Les liens complémentaires distinguent la source du tarif de celle des recommandations.

## 2026-10-24 – Garantie, révision et conseils d'entretien par marque

Relevé sur les sites des marques (pages garantie, conditions de vente, service client, FAQ,
conseils d'entretien), enregistré dans `brand-info.ts` avec source et date, et affiché dans la
rubrique « Garantie et entretien » de chaque fiche (mêmes lignes pour toutes les marques) :

| Marque   | Garantie                                                     | Révision (prix conseillés, France)                     | Autres informations                                                                                                                                                                                   |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Longines | 2 ans, 5 ans automatiques ; exclusions ; page de détail      | Complète 255 à 510 €, partielle 100 à 125 €, pile 35 € | Révision complète tous les 6 à 8 ans, étanchéité une fois par an, révision garantie 24 mois, conseils d'entretien                                                                                     |
| Hamilton | 2 ans ; exclusions ; page de détail                          | Complète 170 à 340 €, partielle 60 à 75 €              | Pas de fréquence fixe, partielle tous les 1 à 2 ans, étanchéité une fois par an, pile 2 à 5 ans, pièces 10 ans après l'arrêt du modèle, Swiss Made, mouvements ETA développés avec Hamilton, conseils |
| Tissot   | 2 ans, 3 ans Lightmaster Solar et COSC ; conditions de vente | Non publiés (pages vides)                              | —                                                                                                                                                                                                     |

Conseils d'utilisation : liste commune reformulée par Aiguille (`CARE_TIPS`), choisie selon la
montre ; « recommandé par la marque » quand la marque le publie, « conseil général » sinon.

## 2026-10-24 – Fiche technique commune à toutes les marques

Une seule fiche technique pour toutes les marques (`packages/db/src/spec-sheet.ts`) : rubriques
Mouvement, Boîtier, Cadran, Bracelet, Garantie et entretien (et Historique pour les pièces
vintage), **mêmes lignes dans le même ordre**, raccourcis vers chaque rubrique. Les libellés de
chaque marque sont reliés aux lignes communes ; une ligne sans donnée affiche « Non communiqué » ;
les libellés non reliés restent visibles dans « Autres informations ». Elle remplace l'ancien
tableau de 13 lignes et la section technique. Raison : retrouver une information au même endroit
d'une fiche à l'autre, quelle que soit la marque. Libellés et valeurs normalisés en Unicode NFC
(Tissot écrit certains accents décomposés, ce qui faisait échouer la lecture de ces libellés).

## 2026-10-24 – Notation masquée, comparaison technique à la place (lot 5)

Choix du propriétaire : noter une montre reste subjectif, et le recul manque pour publier une note.
**La Note Aiguille reste dans le code mais ne s'affiche plus** (`FEATURE_SCORE` : masquée par
défaut, affichée seulement avec `true`). Les avis de la communauté et la connexion restent affichés
(`FEATURE_REVIEWS` : affichés par défaut, même sans réglage ; masqués seulement avec `false`).
Les builds de test e2e activent les deux.
Le site met en avant ce qui se vérifie, sans juger le goût :

| Sujet                                      | Décision                                                                                                                                                                                                                                                                             | Raison                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Fiche                                      | Section « Technique, garantie et entretien » : faits publiés, « non communiqué par la marque » sinon                                                                                                                                                                                 | Montrer la technique et l'entretien sans dire « bonne » ou « mauvaise » montre.    |
| Comparaison                                | « Aussi bien équipées, pour moins cher » : même usage, ±3 mm, ≥ 10 % moins chère, au moins aussi bien sur chaque point                                                                                                                                                               | « Celle-ci, à 300 €, est automatique et plus étanche » : un fait, pas une note.    |
| Preuve                                     | Une donnée connue pour la montre regardée doit l'être pour l'alternative                                                                                                                                                                                                             | Ne rien promettre sans source.                                                     |
| Infos de marque                            | `brand-info.ts` : garantie et fabricant de mouvement **sourcés et datés**, sinon null                                                                                                                                                                                                | Garantie et origine sont rarement sur les fiches ; jamais remplies de mémoire.     |
| Pièces vintage                             | Détectées (année de production), ni comparées ni proposées                                                                                                                                                                                                                           | 47 pièces Longines Heritage de 1916 à 1970 n'ont pas d'équivalent neuf.            |
| Nouvelles marques                          | Procédure [integrer-une-marque.md](integrer-une-marque.md) + rapport `npm run db:couverture`                                                                                                                                                                                         | Les mêmes informations pour chaque marque, et ce qui manque visible tout de suite. |
| Audit (24 octobre)                         | Tissot : garantie 24 mois, 36 pour Lightmaster Solar et COSC (conditions de vente) ; aucun tarif de révision publié (pages vides) ; Hamilton filtré (403) et Longines en maintenance lors de l'audit                                                                                 | Base factuelle du registre ; Hamilton et Longines à revérifier.                    |
| Longines (24 octobre, de nouveau en ligne) | Garantie lue sur chaque fiche (« Garantie LONGINES de 5 ans ») ; règle de marque : 24 mois, 5 ans pour les automatiques ; tarifs de révision publiés (complète 255 à 510 €, partielle 100 à 125 €, pile 35 €), entretien conseillé tous les 6 à 8 ans, intervention garantie 24 mois | Sources : fiches produit, pages garantie et « Tarifs des services ».               |

## 2026-10-21 – Note Aiguille dans son registre et avis séparés (lot 5, remplace l'entrée suivante)

Choix du propriétaire, après revue du premier modèle : celui-ci jugeait un profil de « montre-outil »
(mécanique, étanche, saphir) sur tout le catalogue et dévalorisait les petites montres. Désormais :

| Sujet             | Décision                                                                                                      | Raison                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Deux notes        | **Note Aiguille** /100 (notre évaluation factuelle) et **avis de la communauté** /5, affichés séparément      | « Nous, le site, on dit ça ; voici ce que pense la communauté. »                     |
| Registre          | Chaque montre comparée à sa catégorie : 6 gammes de prix × 7 familles d'usage, élargie si moins de 10 montres | Comparer le comparable : une excellente montre à 500 € peut obtenir 90/100.          |
| Piliers Aiguille  | Mouvement 45 %, construction 30 %, rapport qualité-prix 25 % ; barème 25 % + rang dans la catégorie 75 %      | La qualité vient d'abord du mouvement ; le rang évite de juger dans l'absolu.        |
| Faits             | Extraits des fiches officielles (fréquence, spiral silicium, COSC, complications, fond, couronne…)            | Sourcés, vérifiables ; une donnée non publiée compte pour une valeur moyenne.        |
| Base des calibres | Table `calibers` reconstruite à chaque recalcul à partir des fiches (101 calibres au départ)                  | Aucun fait inventé ; une fiche officielle d'exemple sert de source.                  |
| Étanchéité        | Attendue selon la famille (plongée 200 m et plus, habillée 50 m suffisent)                                    | Ne plus pénaliser les montres habillées.                                             |
| Non noté par nous | Design, finition réelle, histoire, rareté                                                                     | Affaire de goût et d'expérience : rôle des avis. La rareté est signalée, sans bonus. |
| Avis              | 6 critères (design ajouté), notés « par rapport à ce qu'on peut attendre à son prix »                         | Le propriétaire d'une montre à 300 € ne la compare pas à une Rolex.                  |
| Tri communauté    | Moyenne bayésienne ; la fiche affiche la moyenne brute et le nombre d'avis                                    | Un avis isolé à 5/5 ne passe pas devant cent avis à 4,6.                             |

Restent valables de l'entrée suivante : stockage dans `watch_scores`, anti-spam, `AggregateRating`
(moyenne des avis), formulaire sans React Hook Form.

## 2026-10-21 – Avis et note sur 100 (lot 5, remplacé par l'entrée précédente)

Le cahier des charges fixe les poids (50 / 30 / 20, « à valider après les premiers tests ») mais
pas le contenu des piliers. Choix par défaut, ajustables dans `packages/db/src/rating.ts` :

| Sujet           | Décision                                                                                                 | Raison                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Pilier 50 %     | Avis des propriétaires : moyenne bayésienne (a priori 3,5/5 pesant 5 avis, puis moyenne du site)         | Cahier des charges (« moyenne bayésienne + confiance ») ; aucune source externe validée.    |
| Pilier 30 %     | Fiche technique pour le prix : équipement sur 100 (40 %) + rang parmi les montres à ±30 % du prix (60 %) | Calculable pour toutes les montres dès aujourd'hui, explicable (« mieux équipée que X % »). |
| Pilier 20 %     | Prix et disponibilité : remise revendeur (60 %, plafond 20 %) + stock (40 %)                             | Exploite les relevés du lot 3 ; absent pour une montre plus produite.                       |
| Pilier absent   | Poids ramenés à 100 % ; sans avis, note « provisoire », confiance faible                                 | Une note pour chaque fiche, sans masquer qu'elle repose sur les données objectives.         |
| Confiance       | Faible < 3 avis ≤ moyenne < 10 avis ≤ élevée                                                             | Simple à expliquer sur la fiche.                                                            |
| Critères d'avis | Finition, confort, lisibilité, précision, rapport qualité-prix (1 à 5) ; propriétaire ou essayée         | Couvre l'usage réel ; la moyenne des 5 critères alimente le pilier.                         |
| Stockage        | Table `watch_scores`, recalculée après chaque collecte (scraper) et chaque avis (API)                    | Tri du catalogue par note en SQL ; quelques requêtes pour ~1 500 montres.                   |
| Anti-spam       | Connexion obligatoire, Turnstile (si clés définies), pas de lien, 20 avis / 24 h, pas de copier-coller   | Exigences de sécurité du cahier des charges, sans service payant.                           |
| Formulaire      | État React + schéma Zod partagé client / serveur, sans React Hook Form                                   | Un seul formulaire simple : une dépendance de moins.                                        |
| Données Google  | `AggregateRating` = moyenne des avis sur 5, jamais la note sur 100                                       | Règles des extraits enrichis : une note agrégée doit refléter des avis.                     |

Les notes d'autres sites rejoindront le premier pilier quand leurs sources seront validées
(robots.txt, CGU), sous forme de note agrégée et de lien.

## 2026-10-21 – Disjoncteur de collecte

Le 21 octobre, le site de Longines est passé en maintenance (503 pour tout le monde) au milieu de
la collecte : le robot a envoyé environ 3 000 requêtes à un site en panne, puis la tâche a
échoué. Désormais, une source qui ne répond plus est mise de côté pour la nuit et journalisée
comme indisponible, sans faire échouer la tâche (règle 8 de [sources.md](sources.md)). Seuil :
10 erreurs serveur d'affilée, soit 3 à 4 pages avec les nouveaux essais. Ce seuil reste assez
haut pour ignorer une panne passagère, et assez bas pour couper vite une maintenance.

## 2026-10-20 – Thème clair par défaut

Le site s'affiche en clair, quelle que soit la préférence du système ; un bouton de l'en-tête
passe en sombre. Le choix est gardé un an dans le cookie `theme` (fonctionnel, exempté de
consentement), lu par un script inline en tête de `<body>` qui pose la classe `dark` avant
l'affichage : pas de flash, et le serveur ne lit jamais le cookie, donc les pages restent
prérendues et en cache. Cartes et graphiques suivent ce thème (`useIsDarkTheme`). Le script n'est
ni dans `next/script` (exécuté trop tard, flash blanc) ni dans `<head>` (recréé côté client par
React 19, avertissement en console).

## 2026-10-20 – Comptes (lot 5)

| Sujet             | Décision                                                                          | Raison                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Authentification  | Better Auth 1.7 avec l'adaptateur Drizzle, tables `users`, `sessions`, `accounts` | Choix du cahier des charges ; données dans notre base Postgres, sans service tiers payant.                       |
| Connexion         | Google et GitHub uniquement (OAuth), ni mot de passe ni lien magique              | Choix du propriétaire : aucun mot de passe à protéger, aucun service d'e-mail à configurer.                      |
| Session dans l'UI | Lue côté navigateur (`useSession`) dans l'en-tête                                 | Les pages restent statiques et mises en cache ; la session n'entre jamais dans le HTML serveur ni dans le cache. |
| Fournisseurs      | Masqués tant que leurs variables manquent                                         | Le site, la CI et le build fonctionnent sans compte OAuth.                                                       |
| Choix du compte   | `prompt=select_account` chez GitHub et Google                                     | Après une déconnexion, pouvoir changer de compte au lieu d'être reconnecté d'office.                             |
| Données (RGPD)    | Page `/confidentialite` ; suppression du compte en libre-service sur `/compte`    | Exigée par Google pour publier l'application OAuth ; droit à l'effacement sans e-mail de contact public.         |

## 2026-10-19 – Isolation des sorties Next.js dans Docker

Le serveur local conserve `.next` dans `web_next`. Les outils (`next typegen`, `npm run build`) et
les tests de production utilisent `.next-e2e` dans un volume Linux distinct, `web_check_next`.
Cela évite de modifier le cache du serveur de développement pendant les contrôles et de faire
transiter les milliers de fichiers générés par le partage Windows, qui avait rendu les compilations
et le chargement des pages extrêmement lents. Les builds de vérification restent séquentiels.

## 2026-10-19 – Outillage du dépôt

| Sujet        | Décision                                                                                                        | Raison                                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dépendances  | Dependabot version updates retiré ; alertes de sécurité gardées ; montées de version à la main (`npm outdated`) | Les PR automatiques visaient `main` et proposaient des majeures inadaptées (`@types/node` 25 pour Node 24). Les failles connues restent signalées. |
| Vercel `dev` | Aucun déploiement de la branche `dev` (`git.deploymentEnabled`)                                                 | Seule `main` alimente le site ; les previews des PR de fonctionnalité suffisent.                                                                   |

## 2026-10-19 – Carte (lot 4)

| Sujet                      | Décision                                                                                                               | Raison                                                                                                                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pays couverts              | 14 pays européens : FR, DE, IT, ES, NL, BE, AT, PT, IE, CH, GB, SE, DK, PL                                             | Public européen francophone d'abord (décision du propriétaire). Questions ouvertes du cahier des charges tranchées.                                                                                       |
| Prix par pays              | Sites nationaux officiels (JSON-LD), devise locale stockée, conversion à l'affichage au dernier taux BCE (Frankfurter) | Même source que la France, chiffres vérifiables. Un prix dans une autre devise que celle du pays (site « international ») est rejeté.                                                                     |
| Pays absents               | Hamilton : PT et PL ; Longines : IE                                                                                    | Pas de version nationale (redirection vers un autre marché) : pas de prix plutôt qu'un faux prix.                                                                                                         |
| Rotation                   | France chaque jour, 2 autres pays par nuit et par marque : chaque pays revu chaque semaine                             | ~24 000 pages pour 14 pays : impossible chaque nuit au rythme de 4 s. Les prix nationaux bougent peu.                                                                                                     |
| Indice par pays            | Écart **médian** avec la France sur les mêmes références (page /prix-en-europe)                                        | La médiane résiste aux références à prix atypique ; « prix moyen par pays » du cahier des charges.                                                                                                        |
| Boutiques                  | **Écart au cahier des charges** : points de vente agréés publiés par Longines et Hamilton, **sans stock**              | Aucune source gratuite et autorisée ne publie le stock par boutique. Mention « stock non garanti » affichée. Accepté par le propriétaire.                                                                 |
| Boutiques Tissot           | Non collectées                                                                                                         | Localisateur interdit par le robots.txt de Tissot.                                                                                                                                                        |
| Géocodage                  | Inutile : coordonnées publiées dans le JSON-LD des pages boutique                                                      | Nominatim prévu au cahier des charges, remplacé par la source elle-même. Ni e-mail ni téléphone stockés.                                                                                                  |
| Rafraîchissement boutiques | Lots de 400 par nuit et par marque, jamais visitées d'abord ; hors pays couverts revisitées tous les 90 jours          | Liste complète revue en quelques jours sans dépasser le temps d'une tâche.                                                                                                                                |
| Cartes                     | Pays : ECharts + world-atlas (déjà utilisé pour les courbes) ; boutiques : MapLibre **5** + OpenFreeMap                | react-simple-maps non compatible React 19. MapLibre 6 charge son worker en module séparé, mal pris en charge par Turbopack : la v5 (worker intégré) fonctionne d'emblée. OpenFreeMap : gratuit, sans clé. |

## 2026-10-19 – Prix (lot 3)

| Sujet                   | Décision                                                                                                                              | Raison                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Collecte quotidienne    | GitHub Actions, 03:00 UTC, une tâche par marque en parallèle                                                                          | Hors Vercel (cahier des charges) ; la règle de rythme vaut par domaine, donc ~1 h au lieu de ~2 h.                       |
| Fraîcheur du site       | Le scraper appelle `POST /api/revalidate` (secret partagé) → `revalidateTag("catalog", "max")`                                        | Nouveaux prix visibles sans redéploiement ; les nouvelles fiches sont rendues à leur première visite.                    |
| Historique              | Paliers (prix constant jusqu'au changement suivant), prolongés jusqu'au dernier passage                                               | Une ligne n'est stockée qu'au changement : sans prolongation, un prix stable n'aurait qu'un point.                       |
| Courbe                  | ECharts (rendu SVG, chargé à la demande), affichée à partir de 7 jours de relevés ; résumé et tableau en HTML serveur                 | SEO : les chiffres doivent être dans le HTML ; une courbe d'un point n'apprend rien.                                     |
| Stock                   | Dernier relevé du site officiel ; JSON-LD sans `availability` si inconnue                                                             | Ne pas affirmer une disponibilité qu'on ne connaît pas.                                                                  |
| Nouveautés              | Référence apparue plus de 2 jours après la première montre de sa marque                                                               | L'import initial, même découpé en plusieurs exécutions, n'est pas une nouveauté ; aucun changement de schéma.            |
| Exécutions interrompues | Marquées « échouée » au lancement suivant de la même source                                                                           | Un processus tué (arrêt de Docker, runner) ne peut pas se clore lui-même.                                                |
| Revendeurs              | Lepage (3 marques) puis Ocarat (Tissot, Hamilton) ; Histoire d'Or écarté                                                              | Étude du 2026-10-19 (docs/sources.md) : Histoire d'Or ne vend aucune des 3 marques.                                      |
| Rattachement des offres | Par marque + référence normalisée (`reference_key`) ; aucune montre créée par un revendeur                                            | Le catalogue reste défini par les sites officiels ; une fiche revendeur inconnue (ancien modèle) est ignorée et comptée. |
| Offres retirées         | Relevé « sans prix, rupture » pour une offre non revue lors d'une collecte complète (≥ 80 %)                                          | Ne plus afficher une offre disparue, sans tout retirer après une panne.                                                  |
| Affichage               | Tableau « Où la trouver » trié (disponibles puis prix), liens `nofollow` non affiliés, JSON-LD `AggregateOffer` sur toutes les offres | Site non commercial ; données structurées fidèles à la page.                                                             |

## 2026-10-18 – Catalogue et collecte (lot 2)

| Sujet               | Décision                                                                                                                        | Raison                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base de production  | **Neon**                                                                                                                        | Postgres pur, branches de base pour les previews, intégration Vercel. Auth et stockage de Supabase inutiles (Better Auth, R2).                                                               |
| Photos              | **Liens directs vers les images officielles** des marques, avec crédit et lien vers la fiche officielle                         | Meilleur rendu et SEO image. Usage non autorisé formellement : risque accepté pour un site non commercial ; retrait immédiat sur demande d'une marque.                                       |
| Extraction          | JSON-LD `Product` publié par les marques + tableau de caractéristiques HTML                                                     | Le JSON-LD sert à Google : bien plus stable que la mise en page.                                                                                                                             |
| robots.txt          | Vérifié par notre code (`robots-parser`), pas par Crawlee                                                                       | Crawlee télécharge robots.txt avec un User-Agent de navigateur, contraire à nos règles.                                                                                                      |
| En-têtes HTTP       | Générateur d'en-têtes de Crawlee désactivé, User-Agent `AiguilleBot` sur chaque requête                                         | Règle « User-Agent identifiable ». Vérifié sur serveur local.                                                                                                                                |
| Références          | Clé de rapprochement sans séparateurs (`T1374071104100`), affichage reconstitué (`T137.407.11.041.00`)                          | Rapprocher marques, revendeurs et eBay qui écrivent la référence différemment.                                                                                                               |
| Slugs               | Fixés à la création (référence), collection jamais réattribuée                                                                  | URL indexées stables.                                                                                                                                                                        |
| Montres disparues   | Statut « plus produite » seulement après une exécution complète (≥ 80 % des montres revues)                                     | Une panne ou un blocage ne doit pas tout marquer comme arrêté.                                                                                                                               |
| Interface           | shadcn/ui (style base-nova, Base UI) + Lucide ; `cn` local (clsx + tailwind-merge) plutôt que le paquet `cn` proposé par la CLI | Pas de dépendance tierce récente pour deux lignes de code.                                                                                                                                   |
| Thème sombre        | Suit la préférence du système (`prefers-color-scheme`)                                                                          | Pas de sélecteur de thème à maintenir pour l'instant.                                                                                                                                        |
| Images              | `images.unoptimized` : servies telles quelles depuis les marques                                                                | L'optimisation d'images Vercel Hobby serait épuisée par ~1 000 références. Contrepartie : PNG lourds (~2 000 px) ; à revoir (redimensionnement vers R2) si les Core Web Vitals en pâtissent. |
| Pages dynamiques    | Toutes prérendues au build (`generateStaticParams`), `notFound()` avant tout `<Suspense>`, `export const instant = false`       | Vrai statut 404 pour une URL inconnue (avec streaming : 200 + noindex, « soft 404 »).                                                                                                        |
| Textes produits     | Résumé rédigé à partir de nos données, jamais la description marketing des marques                                              | Texte protégé et dupliqué sur des centaines de sites : mauvais pour le droit et le SEO.                                                                                                      |
| Filtres             | Paramètres d'URL nuqs (`marque`, `mouvement`, `prixMin`…), rendu serveur, canonique `/montres`                                  | Partageables, sans pages en double dans l'index.                                                                                                                                             |
| Partial Prefetching | Désactivé (`partialPrefetching: false`)                                                                                         | Il servait une coquille en 200 aux URL absentes du build (`/montres/zzz`) : soft 404. Détecté par les tests e2e sur build de production.                                                     |
| Tests e2e           | Playwright (image Docker officielle) sur build de production ; 3 montres fictives en CI                                         | Le serveur de dev est trop lent et instable pour des tests parallèles ; la CI n'a pas de vraies données.                                                                                     |

## 2026-10-18 – Socle technique (lot 1)

| Sujet            | Décision                                                                             | Raison                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Monorepo         | Workspaces **npm** (`apps/*`, `packages/*`), sans Turborepo                          | Aucun outil en plus ; 3 paquets seulement. Turborepo si les temps de CI l'exigent.                                          |
| Paquets internes | Exportent leurs sources `.ts` (pas de build)                                         | Simplicité ; Next et `tsx` compilent à la volée.                                                                            |
| Next.js          | 16.4 avec `cacheComponents` et `partialPrefetching`                                  | Rendu serveur mis en cache = besoin ISR du cahier des charges.                                                              |
| Linter           | ESLint 9 + `eslint-config-next` + Prettier (pas Biome)                               | Règles officielles Next (Core Web Vitals, a11y). ESLint 10 bloqué : plugins de `eslint-config-next` pas encore compatibles. |
| Tests            | Vitest à la racine, `*.test.ts` à côté du code                                       | Rapide, natif TypeScript. Playwright pour l'e2e, sur build de production.                                                   |
| ORM              | Drizzle + driver `postgres`                                                          | Cahier des charges ; migrations SQL lisibles et versionnées.                                                                |
| Dev local        | Docker Compose ; dépendances dans des volumes Docker                                 | Contrainte « rien sur le PC hors Docker et Git ».                                                                           |
| Déploiement      | Intégration Git Vercel, Root Directory `apps/web`                                    | Previews par PR et prod sur `main` sans workflow à maintenir.                                                               |
| CI               | GitHub Actions : qualité, build, migrations + seed + scraper sur Postgres de service | Bloque les PR cassées avant Vercel.                                                                                         |
| Indexation       | Seul `VERCEL_ENV=production` est indexable                                           | Éviter que les previews soient indexées (contenu dupliqué).                                                                 |
| Langue           | Français partout (UI, docs, commits) ; identifiants de code en anglais               | Public francophone ; conventions de code universelles.                                                                      |

## Questions encore ouvertes

Reprises du cahier des charges, à trancher puis à consigner ici :

- Nom de domaine (et extension `.fr` ou `.com`).
- Site en français seul ou aussi en anglais ? (impact SEO : `hreflang`, structure `/en/`)
- Droits sur les photos : demander l'autorisation aux services presse (liens directs en attendant).
