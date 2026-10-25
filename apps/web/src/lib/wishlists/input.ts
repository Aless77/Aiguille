import { z } from "zod";

/** Listes de souhaits et avis de la communauté : limites et validation (client et serveur). */

export const VISIBILITIES = ["private", "link", "community"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const VISIBILITY_LABELS: Record<Visibility, { label: string; help: string }> = {
  private: { label: "Privée", help: "Visible par vous seul." },
  link: {
    label: "Partagée par lien",
    help: "Toute personne qui a le lien peut la voir, même sans compte.",
  },
  community: {
    label: "Publiée dans la communauté",
    help: "Visible sur la page Communauté ; les membres peuvent donner leur avis.",
  },
};

export const TITLE_MAX = 80;
export const DESCRIPTION_MAX = 500;
export const COMMENT_MAX = 1000;
/**
 * Limites anti-abus et de stockage (base gratuite de 0,5 Go, docs/decisions.md). Au pire, avec
 * les plafonds du site : 20 000 listes, 200 000 montres en liste et 50 000 messages de 1 000
 * caractères, soit environ 60 Mo.
 */
export const LISTS_PER_USER = 20;
export const WATCHES_PER_LIST = 50;
export const DAILY_COMMENT_LIMIT = 30;
export const COMMENTS_PER_USER = 500;
export const COMMENTS_PER_USER_PER_LIST = 40;
/** Au-delà, la discussion d'une liste est close. */
export const COMMENTS_PER_LIST = 300;
/** Plafonds du site entier : au-delà, plus de création (message clair, rien n'est perdu). */
export const SITE_MAX_LISTS = 20_000;
export const SITE_MAX_ITEMS = 200_000;
export const SITE_MAX_COMMENTS = 50_000;

// Anti-spam : pas de lien dans un texte affiché publiquement (comme les avis).
const noLinks = (s: string) => !/https?:\/\/|www\.|\.(com|fr|net|org|io)\b/i.test(s);
const LINK_ERROR = "Les liens ne sont pas acceptés";

const title = z
  .string()
  .trim()
  .min(1, "Donnez un nom à la liste")
  .max(TITLE_MAX, `${TITLE_MAX} caractères au plus`)
  .refine(noLinks, LINK_ERROR);

const description = z
  .string()
  .trim()
  .max(DESCRIPTION_MAX, `${DESCRIPTION_MAX} caractères au plus`)
  .refine(noLinks, LINK_ERROR)
  .transform((s) => (s === "" ? null : s))
  .nullable()
  .optional();

export const createListInput = z.object({
  title,
  description,
  visibility: z.enum(VISIBILITIES).default("private"),
  /** Sans nom ni photo : l'auteur apparaît comme « Auteur de la liste ». */
  anonymous: z.boolean().default(false),
  /** Montre ajoutée d'emblée (création depuis une fiche). */
  watchId: z.number().int().positive().optional(),
});

export const updateListInput = z
  .object({ title, description, visibility: z.enum(VISIBILITIES), anonymous: z.boolean() })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Rien à modifier");

export const itemInput = z.object({ watchId: z.number().int().positive() });

export const commentInput = z.object({
  body: z
    .string()
    .trim()
    .min(2, "Écrivez votre avis")
    .max(COMMENT_MAX, `${COMMENT_MAX} caractères au plus`)
    .refine(noLinks, LINK_ERROR),
  /** Avis sur une montre précise de la liste (null : sur la liste entière). */
  watchId: z.number().int().positive().nullable().optional(),
  /** Réponse à un avis de la même liste. */
  parentId: z.number().int().positive().nullable().optional(),
  /** Sous pseudonyme (ou « Auteur de la liste » pour son auteur), choisi à chaque message. */
  anonymous: z.boolean().default(false),
  turnstileToken: z.string().max(4096).optional(),
});

export type CreateListInput = z.input<typeof createListInput>;
export type CommentInput = z.input<typeof commentInput>;

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/**
 * Identifiant public d'une liste (dans l'URL) : 12 caractères aléatoires, soit environ 60 bits.
 * Impossible à deviner : une liste « partagée par lien » n'est vue que par qui a reçu l'URL.
 * Alphabet sans caractères ambigus (l, 1, o, 0) pour une URL lisible.
 */
export function newShareId(bytes: Uint8Array = crypto.getRandomValues(new Uint8Array(12))): string {
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const SHARE_ID_PATTERN = /^[a-km-np-z2-9]{12}$/;

/** Une liste est lisible par tous sauf si elle est privée. */
export function isPublic(visibility: Visibility): boolean {
  return visibility !== "private";
}

/** Résumé des montres d'une liste : nombre et budget total (prix catalogue connus). */
export function listBudget(items: { priceCents: number | null }[]): {
  count: number;
  totalCents: number;
  unknownPrices: number;
} {
  return {
    count: items.length,
    totalCents: items.reduce((sum, i) => sum + (i.priceCents ?? 0), 0),
    unknownPrices: items.filter((i) => i.priceCents === null).length,
  };
}

/** Compteurs lus en base avant d'accepter un message. */
export interface CommentCounts {
  /** Messages du compte sur 24 h, au total, et sur cette liste. */
  userToday: number;
  userTotal: number;
  userOnList: number;
  /** Messages publiés sur cette liste, et sur tout le site. */
  onList: number;
  site: number;
}

/** Raison de refuser un nouveau message, ou null s'il est accepté. */
export function commentLimit(c: CommentCounts): string | null {
  if (c.site >= SITE_MAX_COMMENTS) {
    return "La communauté a atteint sa capacité : les nouveaux messages sont suspendus.";
  }
  if (c.onList >= COMMENTS_PER_LIST) {
    return `Cette discussion a atteint ${COMMENTS_PER_LIST} messages : elle est close.`;
  }
  if (c.userToday >= DAILY_COMMENT_LIMIT) return "Trop de messages aujourd'hui : réessayez demain.";
  if (c.userOnList >= COMMENTS_PER_USER_PER_LIST) {
    return `${COMMENTS_PER_USER_PER_LIST} messages au plus par personne sur une liste.`;
  }
  if (c.userTotal >= COMMENTS_PER_USER) {
    return `${COMMENTS_PER_USER} messages au plus par compte : supprimez-en d'anciens pour écrire.`;
  }
  return null;
}
