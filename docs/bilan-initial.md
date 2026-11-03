# Bilan initial — Aiguille et atelier AV

31 octobre 2026. Étape 1 de la [feuille de route commune](feuille-de-route.md).

## Conclusion

Le socle local répond sur les parcours échantillonnés. Le principal écart constaté concerne
la livraison : le mode privé fonctionne localement, alors que la production sert encore
le catalogue sans autorisation et annonce `index, follow` sur la fiche examinée.
L’atelier reste autonome et utilisable pour poursuivre la construction des deux montres.

Cette étape est terminée comme **bilan ciblé**, avec les réserves ci-dessous. Elle ne vaut
ni validation exhaustive du site, ni recette de production, ni validation esthétique des montres.
Aucun déploiement, changement d’accès distant, lancement de collecte ou modification de données
n’a été effectué pendant ce bilan.

## Vérifications locales

Contrôle reproductible, en lecture seule, avec le serveur de développement déjà lancé :

```sh
docker compose exec -T web node /app/scripts/bilan-local.mjs
```

Le script utilise la configuration du serveur local pour signer une session de contrôle,
sans afficher les identifiants ni écrire de compte en base. Il vérifie l’autorisation des
requêtes ; il ne simule pas la saisie du formulaire de connexion administrateur.

| Parcours                           | Constat                                                                                                                                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visiteur → catalogue               | Redirection HTTP 307 ; page de demande d’accès inspectée dans le navigateur.                                                                                   |
| Visiteur → API avis et listes      | HTTP 403.                                                                                                                                                      |
| Ancienne adresse `/administration` | HTTP 404.                                                                                                                                                      |
| Sitemap et robots                  | Sitemap sans URL ; exploration interdite.                                                                                                                      |
| Session administrateur signée      | Accueil, catalogue, marques, nouveautés, boutiques, prix européens et communauté en HTTP 200.                                                                  |
| Catalogue anglais                  | `/en/montres` en HTTP 200 ; couverture éditoriale complète non contrôlée.                                                                                      |
| Fiches des six marques             | Un échantillon par marque en HTTP 200, rubrique technique et JSON-LD Product dans le HTML, `noindex` présent.                                                  |
| Atelier AV                         | Modèles métal et cuir affichés ; changement de modèle, profil et retour à la vue signature contrôlés ; aucun avertissement ni erreur dans le journal consulté. |

Les réponses HTTP des boutiques et de la communauté ne prouvent pas le fonctionnement complet
de la carte ou des parcours de publication. Aucun avis, liste ou demande d’accès n’a été créé.

## Production et collecte distante

L’[accueil de production](https://aiguille.aless-villa.com/) affichait **2 197 montres**, cinq
marques et aucun filtrage d’accès. La recherche de `T1560102203101` a renvoyé un résultat et
conduit à la [fiche Tissot Ballade examinée](https://aiguille.aless-villa.com/montres/tissot/ballade/t156-010-22-031-01).
Prix catalogue visible : 395 €, disponibilité, caractéristiques, offres et historique présents.
La fiche indiquait un relevé officiel du 31 octobre. Sa métadonnée robots était `index, follow`.
Les journaux navigateur consultés pour cette fiche et pour la demande locale ne contenaient
pas d’erreur.

La [collecte GitHub du 31 octobre](https://github.com/Aless77/Aiguille/actions/runs/41187823242)
est terminée avec succès. Les tâches migrations, Tissot, Hamilton, Longines, Citizen, Seiko,
Lepage et Ocarat portent toutes la conclusion `success`. Venezianico ne figure pas dans cette
exécution. Cela confirme l’exécution des tâches existantes, pas la couverture de chaque référence
ni la qualité intégrale de chaque source. Aucun journal détaillé de collecte n’a été audité ici.

Écart secondaire sur la fiche examinée : le résumé européen annonce « moins chère » avec
un avantage arrondi à 0 %. À reprendre lors de la fiabilisation, après vérification du calcul
et de la précision d’affichage.

## Instantané de la base locale

Agrégats lus directement dans PostgreSQL, sans données personnelles.

| Marque      | Montres | Prix renseigné | Au moins une URL d’image | Dernière présence locale maximale |
| ----------- | ------- | -------------- | ------------------------ | --------------------------------- |
| Longines    | 826     | 826            | 826                      | 24 octobre                        |
| Tissot      | 455     | 455            | 455                      | 18 octobre                        |
| Seiko       | 447     | 428            | 447                      | 25 octobre                        |
| Hamilton    | 292     | 292            | 292                      | 18 octobre                        |
| Citizen     | 148     | 148            | 148                      | 25 octobre                        |
| Venezianico | 104     | 104            | 104                      | 31 octobre                        |

Total local : **2 272 montres** ; Oris ne contient aucune montre. Dix-neuf Seiko n’ont pas de
prix catalogue. Une URL d’image renseignée ne garantit pas que le serveur distant affiche l’image.
La base locale n’est pas synchronisée en continu avec la production : les différences de nombre
et les anciennes dates locales ne prouvent pas une panne de la collecte distante.

Autres agrégats : 3 964 observations, neuf pays représentés ; 1 560 boutiques actives et
3 752 en attente. Ces observations sont des changements de prix ou de stock, pas autant de
relevés quotidiens. Aucun stock par boutique ne peut être déduit du nombre de boutiques actives.

Deux anciennes collectes locales de boutiques portent encore `running` depuis le 19 octobre.
Le dernier enregistrement local Venezianico est `success`, avec 85 montres trouvées et 35 erreurs
sur 151 pages. Cette conclusion ne suffit donc pas à présenter sa couverture comme complète.
Les travaux de collecte en cours dans le dossier partagé n’ont pas été modifiés.

## Priorités retenues pour la suite

| Priorité            | Action                                                                                                                               | Critère de clôture                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Livraison       | Préparer la livraison du mode privé existant pour revue par le propriétaire.                                                         | Après sa publication, catalogue protégé, API protégées, sitemap vide et non-indexation vérifiés en production. Aucun déploiement automatique dans ce bilan. |
| 2 — Couverture      | Vérifier la livraison de Venezianico et la qualité de ses relevés ; distinguer exécution réussie et références réellement couvertes. | Rapport de couverture sourcé et tâches distantes correspondant au périmètre retenu.                                                                         |
| 3 — Construction AV | Poursuivre l’étape 2 : maillons et fermoir métal, liaisons aux boîtiers, derniers raccords du cuir, proportions des petites pièces.  | Deux montres crédibles sous plusieurs angles, avant les finitions de lumière et toute animation.                                                            |
| 4 — Fiabilisation   | Reprendre le résumé européen arrondi à 0 %, puis les défauts confirmés lors de la recette fonctionnelle.                             | Message cohérent avec l’écart effectivement affiché et tests pertinents du calcul.                                                                          |

La livraison distante suit les règles Git du propriétaire. Son attente n’empêche pas de travailler
localement sur les modèles AV dans l’espace indépendant.

## Contrôles et limites

`npm run check`, `npm run build` et le build séparé de l’atelier ont réussi dans Docker.
Le build de l’atelier conserve un avertissement de taille du moteur 3D : environ 144 ko de
JavaScript compressé, avec une texture de cuir d’environ 458 ko. Le poids concerne l’atelier,
pas les pages du catalogue.

Captures conservées hors dépôt, dans le dossier de visualisations de cette conversation :
`bilan-local-acces.png`, `bilan-production-fiche.png`, `bilan-atelier.png`.

Non vérifiés dans cette étape : OAuth réel, acceptation/révocation de membres dans le navigateur,
écritures communautaires, alertes, tous les filtres et toutes les langues, toutes les images,
stock de chaque source, quotas d’hébergement et performances sur téléphone physique.
La base distante n’a pas été consultée ; aucun secret ni contenu de compte n’a été affiché.
