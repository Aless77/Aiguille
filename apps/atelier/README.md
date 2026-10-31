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
Il est lié à l’interface locale du poste. Aucun lien n’est ajouté dans Aiguille.

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
- Rendu à la demande, suspendu hors écran ou dans un onglet masqué ; résolution plafonnée.
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
Le verre est une approximation légère par transparence, sans réfraction physique complète.

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

L’atelier partage le verrouillage npm et les contrôles du dépôt ; son code, ses styles et ses
dépendances ne sont pas importés par `apps/web`. Son build est séparé du build Vercel existant.
Tout hébergement futur doit être décidé séparément. L’atelier local est non indexable.
