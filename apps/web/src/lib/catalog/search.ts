import { brands, collections, watches } from "@aiguille/db/schema";
import { and, ilike, or } from "drizzle-orm";

/** Échappe les jokers LIKE : la saisie est cherchée comme du texte, jamais comme un motif SQL. */
const literal = (value: string) => value.replace(/[\\%_]/g, "\\$&");

/** Tous les mots doivent correspondre ; les références ignorent leur ponctuation. */
export function catalogSearch(search: string) {
  const words = search.trim().slice(0, 120).split(/\s+/).filter(Boolean);
  return and(
    ...words.map((word) => {
      const pattern = `%${literal(word)}%`;
      const reference = word.replace(/[^a-z0-9]/gi, "").toUpperCase();
      return or(
        ilike(watches.name, pattern),
        ilike(brands.name, pattern),
        ilike(collections.name, pattern),
        ilike(watches.reference, pattern),
        reference ? ilike(watches.referenceKey, `%${reference}%`) : undefined,
      );
    }),
  );
}
