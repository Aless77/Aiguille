# Accès privé et demandes

Depuis le 31 octobre 2026, les pages du site sont réservées aux membres approuvés.
Cette décision du propriétaire remplace l'ouverture publique et l'objectif d'indexation.

## Configuration

Définir dans `.env` en local et dans les variables privées Vercel en production :

- `ADMIN_USERNAME` : votre identifiant administrateur ;
- `ADMIN_ACCESS_PATH` : une adresse privée commençant par `/`, suivie de 16 à 80 caractères
  parmi les lettres minuscules, chiffres et tirets. Choisir une valeur personnelle imprévisible ;
- `ADMIN_PASSWORD` : votre mot de passe, au moins 16 caractères hors développement local.
  Avec `next dev` hors Vercel, un mot de passe court comme `test` est accepté pour les essais ;
- `BETTER_AUTH_SECRET` : un secret aléatoire d'au moins 32 caractères.

Ne jamais enregistrer ces valeurs dans le dépôt ni les préfixer par `NEXT_PUBLIC_`.
Redémarrer le service local ou redéployer après modification de la configuration.
Appliquer la migration `0011` avant de déployer cette version (`npm run db:migrate` dans Docker).
Les fournisseurs Google/GitHub existants restent nécessaires pour les membres.

Ouvrir directement l'adresse définie dans `ADMIN_ACCESS_PATH`, saisir les identifiants puis
accepter ou refuser les demandes. Aucun lien ou bouton du site ne mène à cette adresse.
Il n'y a pas d'adresse par défaut : sans configuration, l'entrée est désactivée.
L'ancienne adresse `/administration` renvoie 404, sans redirection vers l'adresse privée.
Le chemin reste configuré uniquement côté serveur ; ne pas le mettre dans une variable publique.
La connexion par identifiant et mot de passe reste obligatoire à cette adresse.
Une demande acceptée peut ensuite être refusée pour retirer l'accès, et inversement.
Le lien « Entrer sur le site » permet à l'administrateur de consulter le catalogue.
Cette session ne crée pas de compte de membre pour publier des avis.

## Parcours membre

1. Un visiteur est dirigé vers `/demande-acces`.
2. Il s'identifie avec Google/GitHub. Un compte technique est créé sans accès au catalogue.
3. Il renseigne ses motivations, sa provenance / découverte du site et les marques souhaitées.
4. Il consulte la décision sur cette page ; aucun e-mail automatique n'est envoyé.
5. Après acceptation, il accède au site avec ce même compte Google/GitHub.

Une seule demande par compte ; le formulaire ne permet pas d'écraser une décision.
Les comptes déjà existants doivent eux aussi demander un accès. Aucun n'est approuvé d'office.
Une personne refusée peut toujours consulter son statut et supprimer son compte.

## Protection

Le proxy relit la session réelle et la décision en base avant de servir les pages, y compris
les pages prérendues, les réponses RSC, les images dynamiques et les chemins contenant un point.
Cette lecture supplémentaire en entrée est volontaire pour protéger le catalogue en cache sans
transformer toutes les pages en pages dynamiques. Les API d'avis et de listes vérifient aussi
l'approbation dans leur propre fonction d'authentification.
Les décisions prennent effet à la requête suivante ; une page déjà affichée ne peut être effacée
du navigateur à distance.

Exceptions accessibles : connexion, demande, administration (formulaire uniquement sans session),
confidentialité, gestion de son propre compte et ressources techniques. `/api/revalidate` conserve
son contrôle par secret indépendant. Better Auth reste accessible pour gérer son propre compte.

Les réponses sont visibles uniquement par l'administrateur, conservées jusqu'à suppression du
compte puis effacées en cascade. Aucun cache partagé pour les demandes et les sessions.
Session administrateur signée, cookie HTTP-only, SameSite strict, sécurisé en production,
valable 8 heures. Changer les identifiants ou le secret révoque toutes ces sessions.
La connexion autorise 10 tentatives par fenêtre de 15 minutes, avec un compteur global en base
partagé entre les instances. Un succès remet le compteur à zéro.

Sitemap vide, exploration interdite dans `robots.txt`, pages en `noindex`, même en production.
Les anciennes pages déjà indexées ne disparaissent pas instantanément des moteurs.

## Vérification

Dans Docker, exécuter `npm run check` et `npm run build`.
Les tests couvrent le formulaire, les signatures, l'expiration, la révocation et les routes privées.
Vérifier les callbacks OAuth en production après déploiement.

Les tests Playwright du catalogue utilisent une session administrateur réellement signée.
En local, définir des valeurs éphémères `E2E_ADMIN_USERNAME`, `E2E_ADMIN_PASSWORD` (16 caractères
minimum), `E2E_ADMIN_ACCESS_PATH` (adresse de test privée) et `E2E_AUTH_SECRET` (32 caractères minimum) dans l'environnement du terminal avant
`docker compose run --rm e2e`. Ces valeurs concernent uniquement les services de test.
La CI génère ses propres identifiants éphémères. Le parcours de demande utilise un compte fictif
isolé et le supprime après le test, sans passer par un fournisseur OAuth externe.

Validation locale du 31 octobre 2026 : `npm run check` réussi (306 tests), build réussi,
6 parcours Playwright réussis (ordinateur et mobile). Captures inspectées : formulaire lisible,
administration et boutons accessibles sans débordement. Parcours complet vérifié : demande,
attente, acceptation, accès au catalogue, retrait puis refus des pages et API.
Le navigateur n'a signalé aucune exception sur le parcours visiteur et les journaux du serveur
étaient sans erreur lors des essais finaux. Le plugin Browser étant absent, les essais utilisent
Playwright dans Docker contre `http://web-prod:3000`. Les callbacks Google/GitHub distants et
la configuration réelle de production restent à vérifier après déploiement.
