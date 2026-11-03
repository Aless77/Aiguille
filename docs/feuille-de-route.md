# Feuille de route commune — Aiguille et atelier AV

31 octobre 2026. Proposition de séquencement à partir du cahier des charges du 18 octobre,
des décisions du dépôt et des deux modèles AV choisis par le propriétaire.

## Intention commune

Aiguille aide à comprendre et comparer les montres grâce aux données. L’atelier AV permet
d’explorer deux créations originales et leurs détails. Les deux contribuent à un même projet
horloger, avec une identité cohérente et des parcours distincts.

La séparation demandée est conservée : `apps/web` pour Aiguille, `apps/atelier` pour la 3D.
Une navigation entre ces espaces les relie sans importer le moteur 3D dans le catalogue.
L'entrée dédiée et le retour sont préparés localement à l'étape 6 ; les adresses distantes,
les protections de l'atelier et la publication restent à choisir. Aucun partage des comptes.

## Point de départ

**Étape 1 réalisée comme bilan ciblé le 31 octobre 2026** : voir le
[bilan initial](bilan-initial.md), ses écarts de livraison et ses réserves de validation.
**Étape 2 réalisée en étude numérique le 31 octobre 2026** : bracelet métal reconstruit,
raccords, fermoir, cornes du modèle cuir et tranches repris ; contrôle en matière neutre
via « Volumes ». **Étape 3 implémentée le 1er novembre 2026** : brossage, grain, cuir satiné,
aiguilles facettées, lunette profilée, réhaut et glace bombée ; studio commun et ambiances
réfléchies distinctes. Voir la [revue des matières](../apps/atelier/design-qa-etape3.md).
La validation esthétique des deux rendus par le propriétaire reste à recueillir pour clore
l’étape 3. **Étape 4 : contrôles locaux réalisés le 1er novembre 2026**, en poursuivant le travail
technique : regroupement des pièces, réutilisation des modèles et des ombres, budget de résolution,
alternances répétées, reprise graphique et replis. Voir le [README de l’atelier](../apps/atelier/README.md).
Téléphone physique et autres navigateurs restent à vérifier. **Étape 5 : corrections locales
du 1er novembre** sur les résumés européens, les ex æquo et les textes devenus incomplets avec
l'élargissement du catalogue. Accès privé et HTML autorisé contrôlés localement ; préparation
de livraison actualisée dans [deploiement.md](deploiement.md).
La recette en production de cette version reste à effectuer après sa livraison par le propriétaire.
**Étape 6 : parcours local préparé le 1er novembre**, entrée « Atelier AV » dans la navigation
et présentation distincte en pied de page ; retour vers Aiguille dans l'atelier.
Les liens de production exigent une adresse HTTPS explicite ; aucune publication effectuée.
Cette étape de construction ne vaut pas acceptation esthétique finale ni plan de fabrication.

- Le catalogue, les relevés de prix, les cartes, les comptes et les fonctions communautaires
  disposent déjà d’implémentations. Leur état local ne prouve pas leur validation en production.
- Deux premières montres AV sont manipulables : 02 Obsidienne (métal noir), 01 Éclipse (cuir noir),
  aiguilles or champagne et monogramme AV. La forme coussin est écartée.
- Les deux bracelets et leurs liaisons ont été repris à l’étape 2. Le verre, les microtextures
  et les reflets ont une nouvelle version à examiner à l’étape 3.
- Le cahier des charges initial reste la référence des objectifs ; les décisions ultérieures
  précisent le périmètre actuel : accès privé, Note Aiguille masquée, Oris écartée,
  Citizen et Seiko intégrées, Venezianico ajoutée, cinq langues prévues.
- Aucune réactivation de note, ouverture publique ou nouvelle collecte n’est impliquée ici.

## Ordre de développement proposé

Les étapes ci-dessous se succèdent. La maintenance d’une collecte cassée ou d’un accès bloqué
reste prioritaire à tout moment ; elle ne doit pas servir à ouvrir de nouvelles fonctionnalités.
On termine et vérifie une étape avant de déplacer l’effort principal vers la suivante.

| Étape                                 | Travail                                                                                                                                                                                                           | Résultat attendu avant de poursuivre                                                                                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — État réel et priorités            | Vérifier les parcours existants du site, identifier les écarts entre code, données locales et production, dresser une liste courte de défauts bloquants.                                                          | Bilan factuel : ce qui fonctionne, ce qui est incomplet, ce qui bloque. Aucun chantier existant inutilement reconstruit.                                                        |
| 2 — Construction des deux montres     | Finaliser boîtiers, cornes, couronnes, aiguilles, index, monogramme et assemblages ; reprendre le bracelet métal, puis les derniers défauts du cuir.                                                              | Chaque montre reste crédible en vues cadran, profil et dos, avec épaisseurs et liaisons cohérentes.                                                                             |
| 3 — Matières et éclairage             | Affiner acier noir brossé et poli, cuir, coutures, or champagne, verre et profondeur du cadran ; stabiliser une lumière studio commune.                                                                           | Captures comparables aux concepts choisis ; le propriétaire valide les deux rendus statiques.                                                                                   |
| 4 — Robustesse et performances 3D     | Vérifier rotation, zoom, changements répétés de modèle, chargement des textures, petit écran, rendu à la demande et comportement sans WebGL. Réduire les ressources si nécessaire.                                | Atelier stable sur les navigateurs testés, modèle visible sur mobile, commandes utilisables et absence d’erreurs bloquantes. Limites des essais documentées.                    |
| 5 — Fiabilisation d’Aiguille          | Corriger les écarts confirmés à l’étape 1 : accès privé, catalogue, recherche, prix, stock, nouveautés, traductions, cartes et collecte quotidienne.                                                              | Une version stable du cœur du site, validée sur les parcours réels ; données absentes ou incertaines signalées honnêtement. Préparation de livraison revue par le propriétaire. |
| 6 — Expérience commune et publication | Harmoniser les signatures visuelles sans imposer le thème sombre de l’atelier au catalogue. Proposer une entrée dédiée et un retour clair. Choisir l’hébergement et les règles d’accès avant toute mise en ligne. | Passage entre les deux expériences compréhensible, chargement 3D limité à l’atelier, règles d’accès et d’indexation respectées. Publication après décision du propriétaire.     |
| 7 — Comparaison utile                 | Développer le comparateur du cahier des charges : trois montres du catalogue, caractéristiques et prix comparables, différences et lacunes visibles.                                                              | Parcours complet depuis une sélection jusqu’à une comparaison lisible sur ordinateur et mobile. Aucun modèle AV présenté comme une référence commerciale suivie.                |
| 8 — Enrichissements optionnels        | Après validation des étapes précédentes : animations mesurées des montres, exploration des données, alertes ou autres fonctions choisies séparément.                                                              | Chaque ajout répond à un usage précis et conserve la fluidité, l’accessibilité et le budget du projet.                                                                          |

## Détail de la prochaine séquence de modélisation

1. Contrôler les formes en matériau neutre : proportions, silhouette, épaisseur et absence
   d’intersections visibles ; ne pas masquer une mauvaise géométrie par l’éclairage.
2. Reprendre Obsidienne : maillons moins répétitifs, raccord avec le boîtier, articulations,
   fermoir et biseaux capables d’accrocher la lumière.
3. Terminer Éclipse : départ du cuir entre les cornes, recouvrement, passage sous la boucle,
   tranches, couture et finesse du grain à plusieurs distances.
4. Affiner le cadran, les index, les facettes des aiguilles et le dessin du monogramme.
5. Ajuster la forme du verre et ses reflets sans rendre le cadran gris ou illisible.
6. Comparer les deux modèles dans les mêmes cadrages et sous les mêmes lumières, puis
   recueillir les corrections du propriétaire avant toute animation.

Le réalisme visuel ne constitue pas une validation de fabrication : mouvement, tolérances,
étanchéité et plans industriels ne sont pas inclus dans cette séquence.

## Règles de livraison

- Une étape correspond à un changement cohérent et à des preuves consultables.
- Les modifications et fichiers des autres travaux sont conservés.
- Vérifications dans Docker : `npm run check` et `npm run build` ; pour l’atelier,
  également `npm run build -w @aiguille/atelier` et inspection du rendu dans le navigateur.
- Les contrôles locaux, la validation visuelle du propriétaire et la vérification en production
  sont trois états différents. Aucun ne doit être annoncé à la place d’un autre.
- Aucun commit, branche, PR ou déploiement n’est réalisé par l’agent sans changement explicite
  des consignes actuelles du propriétaire.

## Décisions à prendre au moment utile

- Après les rendus statiques : accepter les deux designs ou préciser les retouches.
- Avant publication : valider les entrées locales proposées, choisir les adresses distantes et
  les règles d'accès propres à l'atelier.
- Avant les enrichissements : choisir une priorité entre animation, exploration et alertes.

Les étapes proposées n’annulent pas les décisions de [decisions.md](decisions.md).
Le statut factuel des travaux reste dans [suivi.md](suivi.md).
