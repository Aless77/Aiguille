import { REVIEW_CRITERIA, type ReviewCriterion, type ReviewRatings } from "@aiguille/db/rating";
import { z } from "zod";

export const COMMENT_MAX = 2000;

const star = z.number().int().min(1, "Note de 1 à 5").max(5, "Note de 1 à 5");

/** Avis envoyé par le formulaire (validé côté navigateur et de nouveau côté serveur). */
export const reviewInput = z.object({
  watchId: z.number().int().positive(),
  ratings: z.object(
    Object.fromEntries(Object.keys(REVIEW_CRITERIA).map((k) => [k, star])) as Record<
      ReviewCriterion,
      typeof star
    >,
  ),
  ownership: z.enum(["owner", "tried"]),
  comment: z
    .string()
    .trim()
    .max(COMMENT_MAX, `${COMMENT_MAX} caractères au plus`)
    // Anti-spam : pas de lien dans un avis (le texte est affiché sur une page publique).
    .refine(
      (s) => !/https?:\/\/|www\.|\.(com|fr|net|org|io)\b/i.test(s),
      "Les liens ne sont pas acceptés",
    )
    .transform((s) => (s === "" ? null : s))
    .nullable()
    .optional(),
  turnstileToken: z.string().max(4096).optional(),
});

export type ReviewInput = z.input<typeof reviewInput>;

/** Avis de l'utilisateur connecté, renvoyé au formulaire pour modification. */
export interface OwnReview {
  /** Le design peut manquer sur un avis déposé avant son ajout. */
  ratings: ReviewRatings;
  ownership: "owner" | "tried";
  comment: string | null;
  updatedAt: string;
}

/** Limite anti-abus : avis déposés ou modifiés par un même compte en 24 h. */
export const DAILY_REVIEW_LIMIT = 20;
