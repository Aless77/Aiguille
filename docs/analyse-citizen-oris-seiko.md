# Analyse d’intégration : Citizen, Oris, Seiko

**Décision postérieure à cette étude (25 octobre 2026)** : le propriétaire retient Citizen et
Seiko et écarte Oris du site en raison des restrictions de réutilisation de ses contenus.
Les possibilités Oris ci-dessous constituent l’historique de l’analyse, pas un travail planifié.
Voir [la décision d’intégration](decisions.md).

Étude du **25 octobre 2026**. Ordre demandé : **Citizen → Oris → Seiko**.
Cette étape prépare l’implémentation ; elle n’active aucune nouvelle collecte et n’importe aucune
montre en base. Les conclusions de disponibilité portent sur le poste local, pas sur GitHub Actions.

## Conclusion

Les trois marques existent déjà dans le seed. Le catalogue, les pages, les filtres, les avis,
les listes, les prix et le SEO sont largement communs aux marques. Ajouter seulement trois
adaptateurs ne suffit toutefois pas : les revendeurs excluent actuellement leurs références,
les règles techniques et les déclinaisons ne les connaissent pas, et la couverture multilingue
doit être vérifiée source par source.

| Sujet              | Citizen                                                           | Oris                                                                      | Seiko                                                                                 |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Catalogue français | Sitemap produits : 148 URL                                        | Sitemap multilingue paginé ; inventaire complet non compté                | Sitemap français : 2 129 URL de toutes sortes, pas 2 129 montres                      |
| Extraction testée  | HTML + JSON-LD Product/Offer                                      | HTML et données Nuxt intégrées ; pas de Product JSON-LD sur l’échantillon | Caractéristiques et prix déjà dans le HTML ; pas de Product JSON-LD sur l’échantillon |
| Référence complète | SKU et EAN                                                        | Référence détaillée et identifiants de liens                              | URL et données de page ; H1 parfois abrégé                                            |
| Prix français      | Prix EUR et disponibilité dans le JSON-LD                         | Prix EUR dans la page                                                     | Prix EUR sur la fiche Prospex testée                                                  |
| Stock en ligne     | Statut publié, à confronter à l’affichage                         | À caractériser : précommande visible sur certaines références             | Pas de stock démontré sur le catalogue institutionnel                                 |
| Traductions        | FR/DE et EN sur des sites officiels distincts ; IT/ES non établis | FR/EN/DE/IT/ES annoncés par les liens alternatifs                         | FR/EN/DE/IT/ES annoncés par les liens alternatifs                                     |
| Boutiques          | Stock par revendeur explicitement interdit au robot               | Liste publique, conditions de réutilisation restrictives                  | Liste publique ; extraction des coordonnées à valider                                 |
| Réutilisation      | Robots permet les fiches ; droits de réutilisation à clarifier    | CGU interdisant la présentation du contenu sur un autre site              | Conditions limitant l’utilisation secondaire sans autorisation                        |

Ces volumes sont des **URL de sitemaps à la date du relevé**, pas des engagements de couverture,
ni des nombres de montres actives ou réellement disponibles. Aucun historique passé n’est fourni :
l’historique Aiguille commencera au premier relevé.

## Méthode et limites de l’étude

- Lecture du cahier des charges, de la procédure d’ajout de marque et du code existant.
- Requêtes de contrôle depuis le conteneur `tools`, avec User-Agent Aiguille identifiable.
  Robots vérifiés avant l’échantillonnage des fiches ; requêtes espacées sur un même domaine.
- Inspection de deux fiches françaises Citizen (automatique et Eco-Drive), de leur équivalent
  anglais pour l’automatique, d’une Aquis Oris et d’une Prospex Seiko. Une URL Seiko supposée
  a aussi révélé une fausse 404 en HTTP 200 : voir ci-dessous.
- Lecture ponctuelle des pages officielles de garantie, d’entretien et des conditions.
- Pas d’exploration exhaustive, d’appel aux API interdites, de contournement de protection,
  de collecte de stock en boutique ou de modification de données distantes.

Une page accessible et un robots permissif ne constituent pas une autorisation de republier
ses textes, traductions ou images. Les restrictions constatées doivent être résolues avant
d’activer une source contraire aux règles de `sources.md`. Les faits normalisés et les textes
éditoriaux Aiguille doivent rester distingués des contenus protégés des marques.

## 1. Citizen : première intégration

### Sources établies

- [Boutique française officielle](https://fr.citizenwatch.eu/fr/) : opérée par le distributeur
  officiel France, Belgique, Luxembourg, identifié dans ses
  [mentions légales](https://fr.citizenwatch.eu/fr/info/aide/mentions-legales/).
- [Robots français](https://fr.citizenwatch.eu/robots.txt) et
  [sitemap des produits français](https://fr.citizenwatch.eu/media/sitemap/sitemap-products-fr.citizenwatch.eu.xml) :
  148 URL. Le sitemap européen anglophone en contient 430 ; ne pas les importer toutes en les
  présentant comme le catalogue français.
- [TSUYOSA NJ0200-50Z](https://fr.citizenwatch.eu/fr/p/nj0200-50z/) : référence, EAN,
  prix, stock, images, calibre 8210, dimensions, matériaux, étanchéité, réserve et variantes liées.
- [Eco-Drive EO2023-00A](https://fr.citizenwatch.eu/fr/p/eo2023-00a/) : calibre E168,
  autonomie 180 jours, dimensions, verre, bracelet, entre-cornes, étanchéité et manuel.

### Extraction recommandée

Cheerio suffit sur les échantillons. Lire Product/Offer pour SKU, EAN, images, prix et stock ;
extraire toutes les lignes `.c-attribute-table__item` dans `rawSpecs`. Le suffixe de classe
(`--caliber`, `--movement`, `--power-reserve`, etc.) fournit une clé technique pour rapprocher
les traductions, plutôt que de comparer des libellés français et allemands.

Contrôles indispensables :

- Lire d’abord « Mouvement : Eco-Drive » : le même produit porte aussi « Type de calibre :
  Quartz analogique ». Il doit conserver son alimentation solaire dans nos filtres.
- **180 jours ne signifie pas 180 heures.** La conversion donne 4 320 heures, au-delà de la borne
  actuelle de 2 000 heures dans `listingSchema`. Conserver l’expression officielle dans
  `rawSpecs` et définir le traitement de l’autonomie solaire avant de renseigner le champ
  numérique ; ne pas plafonner silencieusement ni rejeter toute la fiche.
- La TSUYOSA testée publie aussi « Largeur : 0 mm » et « Longueur : 400 mm ». Ces champs ne sont
  ni le diamètre ni l’entre-cornes : utiliser les attributs dédiés, avec validation des valeurs.
- Le cadran n’a pas de ligne de couleur sur l’échantillon français automatique : ne pas utiliser
  par erreur la couleur du boîtier. Une donnée absente reste inconnue.
- La boutique française et le site européen peuvent publier des stocks différents pour une même
  référence. Le site européen anglophone n’est **pas** un prix britannique par défaut.
- Utiliser les liens de déclinaisons officiels pour valider les regroupements. Le motif
  `NJ0200` est une piste pour l’exemple TSUYOSA, pas une règle universelle pour toute la marque.
- Les catégories Homme/Femme ne sont pas des collections : TSUYOSA, Promaster, Series 8, etc.
  doivent être relevées et stabilisées avant de créer les slugs publics.

### Langues, boutiques et entretien

La même fiche existe en [anglais](https://citizenwatch.eu/en/p/nj0200-50z/).
Les liens alternatifs français comprennent FR/DE/NL et la Suisse ; le site européen annonce
notamment EN et des sites DE/AT/NL/FI. Aucune correspondance IT/ES n’a été validée dans cette étude.
Prévoir une collecte de traductions indépendante des prix nationaux pour l’anglais ; ne pas
inventer un pays GB pour réutiliser `COUNTRY_LANGUAGES`.

Les chemins `/api/`, `/public-api/`, les appels AJAX et
`/storelocator/retailerproductstock/` sont interdits par robots.txt. Pas d’intégration du stock
par boutique par ces chemins. Le localisateur public reste à examiner pour les seules adresses.

La [garantie européenne publiée en allemand](https://de.citizenwatch.eu/de/info/support/garantieleistungen/)
annonce trois ans avec certificat renseigné ; faire confirmer le périmètre français avant de
remplir sa politique. Ne pas importer les cinq ans de la garantie américaine.
La [FAQ officielle](https://citizenwatch.eu/en/info/support/faq/) distingue entretien et recharge
Eco-Drive ; elle recommande un contrôle périodique tous les deux à trois ans. Aucun tarif français
de révision confirmé dans cette étude : ne pas l’estimer.

Les CGV françaises ont été consultées ; les mentions légales limitent les copies à l’usage privé
et encadrent la réutilisation. La couverture des droits des photos et traductions reste à établir.

## 2. Oris : faisable techniquement, source à autoriser

### Données et extraction

[Aquis Date testée](https://www.oris.ch/fr-FR/product/watch/aquis/aquis-date/01-733-7789-4135-07-8-23-04PEB) :
prix français, référence complète, dimensions, calibre 733-1, fréquence, réserve, matériaux,
garantie, liens de variantes et bracelets compatibles. Les accessoires ne sont pas des variantes
de montre. Les références finissant en `-Set` doivent aussi être prises en charge.

Le site utilise Nuxt avec HTML rendu et `__NUXT_DATA__`. Pas de Product JSON-LD sur cette fiche :
un adaptateur fondé uniquement sur `findProduct()` ne fonctionnerait pas. Privilégier les éléments
techniques du HTML ; si les données Nuxt sont nécessaires, les décoder comme des données
validées, sans exécuter le JavaScript reçu.

Le [sitemap](https://www.oris.ch/sitemap.xml) est un index paginé, dont la première page seule
contient 2 000 URL de plusieurs langues et types de contenu. Inventaire complet non effectué.
Le [robots](https://www.oris.ch/robots.txt) autorise `fr-FR`, `de-DE`, `it-IT`, `es-ES`, les
versions anglaises et quelques autres marchés ; les combinaisons arbitraires sont interdites.
Respecter cette liste pour les prix européens et vérifier la référence après toute redirection.

Les collections sont présentées dans le menu officiel. Valider le regroupement des modèles par
liens et références : ne pas rapprocher toutes les Aquis comme un modèle unique.

### Garantie, entretien et restrictions

L’Aquis 733 testée annonce deux ans, avec extension à trois ans via MyOris. Le
[Calibre 400](https://www.oris.ch/fr-FR/worldoforis/movements/calibre-400) annonce une extension à
dix ans sous condition d’enregistrement et un intervalle d’entretien spécifique. Ces règles
ne doivent pas devenir une garantie ou un entretien universels pour toutes les Oris.
Une précision annoncée meilleure que les tolérances du COSC ne prouve pas une certification COSC.
Aucun tarif français complet de révision validé.

Le [localisateur](https://www.oris.ch/fr-FR/storefinder) fournit une liste de boutiques et
revendeurs ; cela ne prouve aucun stock de montres. Coordonnées géographiques et compatibilité
avec `parseStoreListing` non validées.

**Réserve déterminante :** la section 2 des
[CGU françaises](https://www.oris.ch/fr-FR/terms-use) interdit l’utilisation ou la présentation
du contenu sur un autre site. Ne pas activer la collecte/republication officielle en l’état.
Le cahier des charges prévoyait déjà Oris via les revendeurs : étudier une autorisation ou un
flux de données, ou une source revendeur réutilisable. Les adaptateurs revendeurs actuels ne
créent jamais de montres : leur permettre de définir ce catalogue nécessiterait une décision
explicite sur la provenance et la couverture, pas un simple ajout de regex.

## 3. Seiko : HTML exploitable et vigilance sur les références

### Catalogue, prix et langues

Le [robots institutionnel](https://www.seikowatches.com/robots.txt) ne contient pas de restriction
de chemin au relevé. Le [sitemap français](https://www.seikowatches.com/vendor/sitemap?xml=fr-frSeikoSitemap1.xml)
contient 2 129 URL mêlant produits, collections, campagnes, archives et autres pages.
Le filtrer et valider le contenu de chaque fiche ; ne pas interpréter une disparition du sitemap
comme une preuve suffisante d’arrêt de production.

La [Prospex SPB453J1](https://www.seikowatches.com/fr-fr/products/prospex/spb453j1) contient déjà
dans le HTML : prix EUR, calibre 6R55, mouvement, précision, autonomie, rubis, diamètre, épaisseur,
corne à corne, entre-cornes, verre, revêtement, LumiBrite, étanchéité, poids et couronne vissée.
Cheerio semble suffisant pour ces fiches ; l’hypothèse ancienne « Seiko exige Playwright » du
cahier des charges n’est pas confirmée pour cet échantillon. Ne retenir Playwright que pour des
fonctions effectivement absentes du HTML et après vérification des règles de la source.

Points à traiter :

- Le H1 de la fiche est `SPB453`, alors que la référence de l’URL est `SPB453J1`. Conserver la
  référence complète et ne jamais supprimer globalement les suffixes J1/K1 pour le rapprochement.
- Une URL supposée `products/5sports/ssk003k1` renvoie une page « 404 Page non trouvée » avec
  **HTTP 200**. L’extraction doit reconnaître ce contenu invalide sans créer de montre ; ne pas
  considérer le seul code HTTP comme preuve d’existence.
- Le prix est disponible sur l’échantillon, mais pas le stock d’une boutique en ligne. Afficher
  « disponibilité inconnue » en l’absence de preuve, même si la montre est au catalogue.
- Ne pas confondre diamètre et corne à corne dans le champ combiné des dimensions.
- LumiBrite doit alimenter la luminescence ; Hardlex ne doit pas devenir du saphir.
- Les liens alternatifs proposent les cinq langues : utiliser les versions officielles, sous
  réserve de leur présence réelle référence par référence. Les balises `hreflang` du site
  peuvent inverser pays et langue ; valider les chemins plutôt que les recopier aveuglément.
- Exclure Grand Seiko, Credor, horloges, accessoires et autres marques hors périmètre.
- Ne pas utiliser le même calibre ou un préfixe `SRP`/`SPB` comme preuve de déclinaison.

La [boutique officielle française](https://www.seikoboutique.eu/fr/fr/) est une source complémentaire
potentielle de prix/stock, non nécessaire pour le prix de l’échantillon ci-dessus. Son robots
interdit notamment la recherche et des chemins privés. Une requête au sitemap a reçu une
protection Cloudflare **403** depuis Docker : pas de contournement ni de relances insistantes.
L’accès depuis GitHub Actions n’a pas été testé.

### Garantie, service et droits

La [FAQ officielle de garantie](https://www.seikowatches.com/fr-fr/customerservice/faq/catalog-and-guarantee-3)
annonce trois ans pour les achats depuis le 1er juillet 2024, avec les conditions et exclusions
précisées sur la page. La [page SAV officielle](https://www.seikoboutique.eu/fr/fr/content/46-garantie-et-sav)
annonce un an de garantie sur les révisions complètes. Aucun tarif français complet confirmé.
Le [répertoire de revendeurs](https://www.seikowatches.com/fr-fr/stores/list) est public ; les
coordonnées et leur format d’extraction doivent encore être validés, sans en déduire un stock.

Les [conditions du site](https://www.seikowatches.com/fr-fr/content-requirement) encadrent
l’utilisation secondaire de ses contenus et images sans autorisation. Consigner la base de
réutilisation avant activation ; robots.txt ne remplace pas cette vérification.

## Ce qui est déjà commun et ce qu’il faut compléter

| Fonction existante                 | Travail nécessaire pour les nouvelles marques                                                                                                             |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marque, collection, fiche et SEO   | Marques déjà semées ; créer les collections avec des noms stables, tester HTML serveur, canonique, JSON-LD, sitemap et vraies 404                         |
| Recherche et filtres               | Les données normalisées suffisent en partie ; compléter faits et libellés pour matériaux, dimensions, autonomie, fonctions et garantie                    |
| Fiche technique et entretien       | Relier les libellés des trois sources dans `facts.ts`/`spec-sheet.ts`, renseigner `brand-info.ts` avec sources datées ; conserver les inconnues           |
| Traductions des contenus           | `translate` dès l’adaptateur, clés stables, pivot FR, versions officielles, repli visible ; séparer langue et marché si nécessaire                        |
| Déclinaisons et tailles            | Établir les familles à partir des liens officiels ; adapter `MODEL_KEYS` ou le modèle de regroupement si une regex n’est pas fiable                       |
| Historique et nouveautés           | Réutiliser relevés au changement et exclusion de l’import initial des nouveautés ; ne pas inventer un historique antérieur                                |
| Offres revendeurs                  | Ajouter marques et motifs de références dans `offer.ts`, Lepage et Ocarat ; tests de rapprochement et de rejet des fausses correspondances                |
| Prix européens                     | Pays réellement publiés, références identiques, devises correctes, seuil de couverture ; ne pas imposer artificiellement les 14 pays existants            |
| Carte des boutiques                | Adaptateur seulement si source autorisée et adresses/coordonnées prouvées ; stock inconnu par défaut                                                      |
| Alternatives techniques et note    | Recalculer les faits et la couverture ; vérifier les cas solarité, LumiBrite, garanties conditionnelles et COSC ; garder les interrupteurs actuels        |
| Avis, comptes, listes, communauté  | Pas de module par marque ; vérifier l’ajout d’une nouvelle fiche aux parcours existants                                                                   |
| Navigation et collecte quotidienne | Tester l’en-tête avec six marques ; ajouter les sources validées à la tâche GitHub, respecter la sérialisation par domaine et vérifier les durées réelles |

La normalisation actuelle des références conserve les lettres/chiffres et enlève les séparateurs :
elle peut servir de base aux trois marques. Les contrôles T/H/L et les motifs des adaptateurs
revendeurs restent, eux, incompatibles avec les nouvelles références. La présence d’Oris chez
Lepage est établie ; la couverture réelle de chaque couple marque/revendeur reste à inventorier.
Ne pas annoncer les offres disponibles avant ce contrôle.

## Plan d’implémentation et critères de sortie

1. **Citizen : autorisation et petit échantillon.** Fixer le périmètre français et la réutilisation,
   écrire un adaptateur et `translate` avec fixtures minimales issues des pages réelles. Tester
   automatique, solaire, quartz, rupture, prix absent, champ absent et référence invalide.
2. **Citizen : intégration complète.** Relier les faits et la fiche technique, renseigner les sources
   de garantie/entretien, valider collections et déclinaisons, ouvrir les offres autorisées des
   revendeurs. Relever un petit lot local puis tout le périmètre validé. Produire le rapport de
   couverture, sans présenter les champs non disponibles comme réalisés.
3. **Citizen : validation des parcours.** Catalogue, filtres, fiche FR et traductions, historique,
   alternatives, avis/listes, SEO et navigation à six marques sur ordinateur/mobile ; qualité et
   build Docker. Vérifier les prix étrangers seulement pour les marchés établis. La collecte
   quotidienne ne s’active qu’avec la source et le rythme validés.
4. **Oris : même séquence**, une fois la source et ses droits clarifiés. Si le catalogue doit venir
   d’un revendeur, documenter d’abord le changement de provenance et ses limites ; pas de
   modification silencieuse du contrat `OfficialAdapter`/`RetailerAdapter`.
5. **Seiko : même séquence**, avec fixtures couvrant au minimum automatique, solaire, quartz,
   GMT, référence abrégée dans le H1, dimensions combinées et fausse 404. La boutique protégée
   reste désactivée tant que son accès autorisé n’est pas établi.

Pour chaque marque, le lot est terminé quand les données sont vérifiées, les manques visibles,
le rapport de couverture relu et les parcours existants validés. Ni création de branche, ni commit,
ni PR, ni déploiement par l’agent. Aucun contact avec les marques n’a été envoyé pour cette étude.
