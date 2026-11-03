# Atelier AV — collection noire

Atelier de création autonome, distinct du site Aiguille. Deux premières études 3D procédurales
reprennent les directions choisies : **02 Obsidienne** (métal noir) et **01 Éclipse** (cuir noir).
Les images approuvées sont conservées dans `references/`. Le modèle coussin est écarté.

## Ouvrir l’atelier

Depuis la racine, uniquement dans Docker :

```sh
docker compose run --rm tools npm ci
docker compose --profile atelier up -d atelier
```

Ouvrir <http://localhost:4173>. Le service n’utilise ni la base ni les comptes du site.
Il est lié à l’interface locale du poste. Depuis le 1er novembre, une entrée « Atelier AV »
dans Aiguille et un retour dans l'atelier relient les deux applications par navigation complète.
En développement, les liens conservent `localhost` ou `127.0.0.1` et changent seulement de port.
Le service de destination doit être démarré ; aucun lancement automatique n'est ajouté.

### Adresses de publication

- `FEATURE_ATELIER=false` côté Aiguille masque les entrées dans l'en-tête et le pied de page,
  même en développement et même si l'adresse est configurée. Variable absente : entrées autorisées.
  Redémarrer le site en local ou reconstruire la version de production après modification.
  Cet interrupteur d'affichage n'arrête pas le service autonome accessible par son adresse directe.
- `ATELIER_URL` côté site : adresse HTTPS de l'atelier, rendue dans les liens du site au build.
- `VITE_AIGUILLE_URL` côté atelier : adresse HTTPS du site, injectée lors du build de l'atelier.
  Docker ne transmet que cette variable publique au service autonome.
- Sans adresse explicite, le lien correspondant est masqué dans les versions de production.
  Les replis locaux ne sont actifs qu'en développement. Les adresses avec identifiants sont refusées.
- Zod valide l'adresse de retour dans la configuration Vite, sans ajout au code du navigateur.
  Une adresse de retour renseignée mais invalide bloque le démarrage ou le build.
- L'atelier reste en français ; les cinq langues du site présentent ce choix dans son entrée dédiée.

Le lien ne partage ni session, ni données, ni droits d'accès. Le retour respecte le contrôle privé
d'Aiguille. L'atelier n'a pas de protection d'accès distante : son hébergement et sa protection
restent à choisir avant toute publication. `noindex` ne remplace pas une protection d'accès.

```sh
docker compose run --rm tools npm run build -w @aiguille/atelier
docker compose stop atelier
```

## Examiner les modèles

- Deux bracelets : trois maillons articulés ou deux brins de cuir bombés avec surpiqûres.
- Trois éclairages : studio, chaud, contours.
- Quatre vues : signature, cadran, profil, dos ; rotation manuelle et zoom.
- Bouton « Volumes » : matière neutre commune et glace masquée pour examiner la construction.
- Aiguilles fixes à 10 h 10 ; pas d’animation automatique.
- Rendu à la demande, sans boucle continue et suspendu dans un onglet masqué ; résolution plafonnée.
- Boutons accessibles au clavier pour remplacer la manipulation à la souris.

## Construction

`src/watch.ts` contient les pièces et matières : carrure, lunette, fond plein, cornes,
couronne moletée, cadran, index, aiguilles facettées, monogramme AV extrudé et bracelets.
`src/main.ts` contient l’éclairage de studio, les caméras, les commandes et le cycle de rendu.
`src/metal.ts` construit le bracelet à trois rangs : maillons chanfreinés décalés, axes latéraux,
largeur dégressive, maillons de bout et fermoir déployant fermé avec poussoirs et lames intérieures.
Les pièces sont regroupées par matière. `src/bracelet-path.ts` calcule le pas en longueur d’arc
afin que les maillons restent régulièrement espacés sur les parties plates et courbes.
Des tests contrôlent le pas, la symétrie, la conservation des pièces et la validité des géométries.
`src/leather.ts` construit le cuir rembourré, sa doublure, les tranches teintées, les coutures
en volume, le recouvrement des deux brins, la boucle à ardillon et les deux passants.
Les coutures sont regroupées par matière pour limiter les appels de rendu.
La texture `src/assets/black-calfskin.webp` est stockée dans l’atelier ; ses cartes de normales
et de rugosité sont dérivées au chargement. Aucun service distant n’est utilisé à l’exécution.
`src/finishes.ts` produit les microreliefs et rugosités du brossage et du grain du cadran.
Les faces du bracelet partagent les matières du boîtier ; leurs chants gardent un poli distinct.
`src/optics.ts` construit les deux pans des aiguilles et une glace fermée légèrement bombée.
La glace utilise la transmission physique de Three.js, avec réflexion atténuée pour conserver
le cadran noir. Son filtrage de réfraction est adapté à une surface polie : le niveau net du
tampon remplace le filtrage bicubique qui floutait les petits index. Ce raccord au fragment
`transmission_pars_fragment` est propre à Three.js 0.180 ; le revoir lors d’une mise à jour du moteur.
Il s’agit d’un modèle visuel, pas d’une simulation optique d’un saphir industriel.
`src/studio.ts` prépare les sources réfléchies des trois ambiances, à leur première utilisation,
puis réutilise leurs environnements. Leurs ressources sont libérées à la fermeture de la page.
Le verre ajoute une passe de rendu ; aucune animation continue n’est nécessaire.

Texture de cuir créée avec l’outil ImageGen intégré, puis optimisée en WebP (environ 458 ko).
Brief de génération : scan de veau noir à grain fin, carré, vue orthogonale, éclairage diffus
uniforme, sans couture, bord, logo ni reflet directionnel, destiné à servir de texture répétable.
Les variations microscopiques modifient les normales et la rugosité, pas la couleur de l’éclairage.

L’unité représente environ 10 mm. Les dimensions restent une intention esthétique,
sans validation de fabrication, de mouvement ni d’étanchéité. Le fond est plein : aucun calibre
n’est inventé. Les fermoirs sont représentés fermés ; leurs cinématiques et tolérances ne sont
pas simulées.

## État

Première étude manipulable, pas un rendu final de fabrication. Les références sont des images
de concept : leurs microtextures, biseaux, proportions et reflets restent à affiner dans la 3D.
Le cadran, les lettres et les pièces sont de véritables géométries, pas les images plaquées.

Étape 3 reprise le 1er novembre 2026 : finitions, grain, cuir satiné, aiguilles à arête,
lunette profilée, réhaut et glace bombée. Voir la [revue des matières](design-qa-etape3.md).
La validation esthétique des rendus par le propriétaire reste distincte des contrôles techniques.

L’atelier partage le verrouillage npm et les contrôles du dépôt ; son code, ses styles et ses
dépendances ne sont pas importés par `apps/web`. Son build est séparé du build Vercel existant.
Tout hébergement futur doit être décidé séparément. L’atelier local est non indexable.

## Robustesse et coût du rendu — 1er novembre 2026

Les pièces fixes du boîtier sont regroupées par matière (`src/merge-parts.ts`), sans remplacer
leurs reliefs. Un test contrôle les positions et l’orientation des faces réfléchies des cornes.
Les aiguilles sont fixes ; une future animation devra les sortir de ce regroupement.
Les ombres sont recalculées au changement de modèle ; une rotation de caméra réutilise leur carte.

Les deux montres sont construites au premier choix, puis conservées pendant la session : le retour
sur le cuir réutilise sa texture et ses cartes dérivées. Le cache est borné à ces deux modèles,
les environnements à trois lumières ; toutes les ressources sont libérées à la sortie de la page.
Un clic sur le modèle déjà actif ne reconstruit rien. Cela utilise plus de mémoire que de ne garder
qu’une montre, mais supprime les reconstructions et compilations répétées.

Mesures locales dans le navigateur intégré, toutes les passes de rendu comptées :

| Modèle     | Avant, par image | Après, changement de modèle | Après, caméra seule |
| ---------- | ---------------: | --------------------------: | ------------------: |
| Obsidienne |       457 appels |                   28 appels |           19 appels |
| Éclipse    |       343 appels |                   73 appels |           49 appels |

Après chargement des deux montres et des trois lumières, 24 alternances conservent des compteurs
stables : 44 géométries, 15 textures et 15 programmes comptabilisés par Three.js dans cette session.
Ce sont des nombres de ressources, pas une mesure de leurs octets ni une preuve absolue d’absence
de fuite. Le temps CPU de soumission du rendu après préparation se situe généralement autour de
1 ms sur ces alternances ; il ne mesure pas le temps GPU, le chargement initial ni les FPS d’un téléphone.

`src/render-budget.ts` limite le canevas à 1,5 million de pixels et à un ratio de 1,75. Les tailles
nulles sont ignorées, les redimensionnements identiques aussi. Le rendu s’arrête dans un onglet
masqué. Les commandes tactiles ont une hauteur minimale de 44 px sur un périphérique tactile.

Une interruption WebGL désactive les commandes, propose une relance et reprend automatiquement
après restauration, avec le modèle, le point de vue et la lumière conservés. Les environnements
calculés sur le GPU sont recréés. Une texture de cuir indisponible conserve une surface mate
manipulable ; les callbacks d’une montre détruite sont ignorés. Sans JavaScript, une indication
explicite accompagne les commandes désactivées.

Pour reproduire les contrôles **uniquement en développement local** :

- `/?diagnostic=1` : compteurs dans la console et panneau de perte/restauration du contexte.
- `/?diagnostic=no-webgl` : échec d’initialisation injecté, puis bouton de relance pour revenir
  au parcours normal. Ce test ne remplace pas un navigateur réellement privé de WebGL.
- `/?diagnostic=no-texture` : image volontairement invalide pour tester le repli du cuir.

Ces diagnostics et injections sont retirés du build de production. Les essais couvrent le navigateur
intégré sur ordinateur et en largeur mobile ; téléphone physique, autres moteurs graphiques,
perte réelle du pilote et consommation d’énergie restent à vérifier.

Validation Docker : `npm run check` (367 tests sur l’état partagé du dépôt, dont 8 pour l’atelier),
`npm run build` et `npm run build -w @aiguille/atelier` réussis. Aperçu du build contrôlé sur un
serveur local temporaire, puis arrêté : clavier, vues, Volumes, rotation, zoom et passage entre
1 440 px et une largeur mobile demandée de 393 px. Journal de cet aperçu sans erreur ni avertissement.
L’échec WebGL injecté et la texture invalide produisent des messages attendus dans la session de test.
Les marqueurs de diagnostic sont absents des fichiers compilés. Le JavaScript reste à environ
148 ko compressés ; l’avertissement de bundle brut supérieur à 500 ko est conservé.
