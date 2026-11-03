# Revue des matières — atelier AV, 1er novembre 2026

## Périmètre

Étape 3 de la feuille de route, dans l’atelier autonome : Obsidienne et Éclipse.
Références relues : `references/02-obsidienne.png` et `references/01-eclipse.png`.
La [revue initiale](design-qa.md) reste conservée comme historique du 31 octobre.

## Modifications observables

- Faces du boîtier et des maillons brossées dans le même noir, rugosité et microrelief orientés ;
  poli distinct sur les chants et la lunette.
- Deux pans inclinés pour les aiguilles : le contraste vient de leurs normales et de l’éclairage.
- Cadrans distincts : brossage vertical métallique et grain mat fin. Le reflet du cadran mat
  a été réduit après comparaison pour conserver le noir.
- Cuir moins diffus, reflet satiné et grain conservé ; coutures et tranches de l’étape 2 préservées.
- Lunette profilée et réhaut intérieur ; glace fermée légèrement bombée, avec transmission.
  Une première version rendait les index flous et le cadran gris : sources, réflexion et filtrage
  du tampon de réfraction corrigés après comparaison avec et sans verre.
- Studio commun aux deux montres ; ambiances chaude et contours agissant aussi sur les reflets,
  avec environnements calculés au premier usage puis conservés.

## Preuves et comparaison

Captures dans le dossier local
`C:/Users/aless/.codex/visualizations/2026/10/31/01a19307-e692-7830-b476-b624923439fb/` :

- `av-etape3-metal-studio.png` et `av-etape3-cuir-studio.png` : 1 440 × 1 024, vue signature,
  lumière studio commune, même cadrage pour comparer les matières.
- `av-etape3-cuir-chaud.png` : même vue, ambiance chaude.
- `av-etape3-metal-detail.png` : zoom manuel sur le cadran et les facettes ; projection du
  brossage contrôlée dans le sens 12 h–6 h.
- `av-etape3-profil-contours.png` : profil du cuir, réflexion rasante de la glace et silhouette.
- `av-etape3-mobile.png` : largeur 393 px, rendu et commandes mobiles.

Les concepts sont des images de produit, pas des maquettes d’interface. Comparaison des matières,
du contraste noir/or et des proportions de l’objet sans superposition ni étirement des images.
La texture du cuir est plus lisible au sommet du bracelet ; la lunette et les aiguilles répondent
à la lumière. Les microtextures des cadrans restent plus discrètes que celles des concepts à la
distance de la vue signature ; le monogramme géométrique reste différent du dessin typographique
des références. Aucun rendu photoréaliste identique aux concepts n’est annoncé.

## Vérifications

Commandes exécutées dans Docker : `npm run check` (358 tests réussis, dont 6 pour l’atelier),
`npm run build` (14 906 pages sur l’état partagé du catalogue) et build séparé de l’atelier.
Le JavaScript de l’atelier reste autour de 147 ko compressés, texture de cuir inchangée à 458 ko.
L’avertissement de bundle brut supérieur à 500 ko reste présent ; ce moteur n’est pas chargé
par le catalogue.

Dans le navigateur : deux modèles, studio/chaud/contours, cadran/profil/dos/signature,
Volumes avec changement de modèle, zoom, rotation manuelle et remise à zéro examinés.
Passage ordinateur → petit écran → ordinateur, puis changement de modèle hors écran et retour
au rendu : les montres restent visibles. Pas de débordement horizontal observé ni d’erreur ou
d’avertissement dans le journal de cette session. Pas de campagne exhaustive de performances.

## Limites et suite

La glace est un modèle optique temps réel, pas une simulation industrielle de saphir.
Le filtrage de transmission est adapté au fragment Three.js 0.180 : le revoir lors d’une
mise à jour. La passe supplémentaire du verre et les environnements ont un coût graphique
à mesurer à l’étape 4 sur du matériel représentatif ; la fluidité d’un téléphone physique
n’est pas établie par une émulation de largeur.

L’atelier reste indépendant du catalogue. Les rendus sont prêts à être examinés et corrigés
avec le propriétaire ; la validation esthétique finale et la fabrication ne sont pas acquises.
