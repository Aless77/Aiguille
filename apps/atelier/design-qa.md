# Revue visuelle — atelier AV, 31 octobre 2026

## Références et preuves

- Sources approuvées : `references/01-eclipse.png`, `references/02-obsidienne.png` (1536 × 1024).
- Captures navigateur :
  `C:/Users/aless/.codex/visualizations/2026/10/31/01a19307-e692-7830-b476-b624923439fb/av-obsidienne.png`,
  `av-eclipse.png` et `av-mobile.png` dans le même dossier.
- Ordinateur : viewport demandé 1440 × 1024, vue signature, lumière studio.
- Mobile : viewport demandé 393 × 852, vue signature du modèle cuir, capture pleine page.
- Comparaison visuelle : source Obsidienne et capture ordinateur ouvertes ensemble. Comparaison
  de l’objet central, les références n’étant pas des maquettes d’interface. Aucun étirement
  d’image : comparaison des proportions relatives, pas de superposition pixel à pixel.
- Examen ciblé : cadran, aiguilles, logo, cornes et bracelet visibles dans les captures ;
  vues cadran, profil et dos examinées dans le navigateur.

## Résultats fonctionnels

Deux modèles, trois lumières, quatre vues, remise à zéro et rotation par glissement vérifiés.
Les états sélectionnés et les descriptions changent avec le modèle. Affichage mobile examiné,
sans débordement horizontal observé. Journal navigateur sans erreur ni avertissement durant
les parcours testés. Le zoom est fourni par OrbitControls ; pas de mesure de fluidité sur un
téléphone physique ni de validation de toutes les cartes graphiques.

## Surfaces examinées

- Typographie : interface française, titres Georgia, commandes Arial, retour de focus visible.
  La source ne définit pas de typographie d’interface. Le monogramme 3D est géométrique,
  encore différent du dessin typographique fin des concepts.
- Espacement : atelier en trois colonnes sur grand écran ; composition verticale sous 1000 px.
  Le point de rupture a été élargi après observation d’un chevauchement à largeur intermédiaire.
- Couleurs : noir et or champagne respectés ; les premiers reflets trop blancs ont été remplacés
  par un environnement noir avec boîtes à lumière. Le cadran reste plus uniforme que la source.
- Qualité visuelle : géométries 3D effectives, pas une photographie utilisée comme faux modèle.
  Le choix explicite d’une montre procédurale implique une reconstruction en géométrie.
  Les références restent plus détaillées et photoréalistes que cette première étude.
- Contenu : aucune promesse technique de fabrication ; dimensions présentées comme intentions.
  Pas de marque tierce, pas de prix ni d’intégration au catalogue.

## Écarts restant à traiter pour un rendu final fidèle

- [P2] Microtextures trop discrètes : brossage du cadran et grain du cuir moins lisibles que
  dans les concepts. Ajuster les cartes de normales et de rugosité à l’échelle du modèle.
- [P2] Liaison boîtier-bracelet et fermoir simplifiés ; les maillons paraissent plus répétitifs
  et les épaules plus massives que la référence métal. Affiner les pièces et leurs proportions.
- [P2] Verre approximé par transparence légère ; pas de bombé ni de réfraction complète.
  Travailler un profil de glace et son éclairage, puis mesurer son coût sur mobile.
- [P3] Ajuster la finesse du monogramme AV avec le propriétaire.

## Historique des corrections

1. Premier rendu : cadran gris et reflets uniformes. Studio noir, sources plus étroites,
   transparence de verre et intensités corrigées ; nouvelle inspection des deux modèles.
2. Bracelet cuir segmenté : remplacé par un volume continu avec surpiqûres ; vérifié sur mobile.
3. Largeur intermédiaire : composition verticale avancée à 1000 px ; grands écrans et mobile
   revérifiés. Le choix de modèle, les vues et les lumières sont fonctionnels.

## Validation

Contrôle qualité global réussi : 337 tests. Build de production du site réussi (12 586 pages).
Build séparé de l’atelier réussi ; environ 139 ko de JavaScript compressé, moteur 3D compris.
Le build signale un bundle non compressé supérieur à 500 ko, propre à cet atelier autonome.

La première étude est consultable ; la fidélité finale aux concepts reste à travailler.
Il ne s’agit pas d’une validation esthétique finale ni d’une validation de fabrication.

final result: blocked
