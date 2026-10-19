import { hamilton } from "./hamilton.ts";
import { lepage } from "./lepage.ts";
import { longines } from "./longines.ts";
import { ocarat } from "./ocarat.ts";
import { tissot } from "./tissot.ts";
import { type SourceAdapter } from "./types.ts";

/**
 * Sources actives. Les sites officiels définissent le catalogue ; les revendeurs y rattachent
 * leurs offres. Lancer les officiels avant les revendeurs (une nouvelle référence doit exister).
 */
export const sources: Record<string, SourceAdapter> = {
  tissot,
  hamilton,
  longines,
  lepage,
  ocarat,
};
