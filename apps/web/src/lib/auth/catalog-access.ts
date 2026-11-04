/**
 * Marqueur posé par le proxy quand le visiteur a accès au catalogue (membre approuvé ou session
 * administrateur). Le proxy supprime toute valeur envoyée par le navigateur avant de le poser :
 * seul le serveur peut l'écrire. Sans lui, les pages ouvertes (connexion, demande d'accès,
 * confidentialité, compte) n'affichent rien du catalogue : ni navigation, ni marques.
 */
export const CATALOG_ACCESS_HEADER = "x-aiguille-catalog-access";

/** Pages servies sans accès approuvé : celles qu'il faut pour demander l'accès ou partir. */
export const OPEN_PAGES = ["/connexion", "/demande-acces", "/confidentialite", "/compte"];
