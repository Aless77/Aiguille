import { hamilton } from "./hamilton.ts";
import { citizen } from "./citizen.ts";
import { seiko } from "./seiko.ts";
import { lepage } from "./lepage.ts";
import { lip } from "./lip.ts";
import { longines } from "./longines.ts";
import { ocarat } from "./ocarat.ts";
import { tissot } from "./tissot.ts";
import { tagHeuer } from "./tag-heuer.ts";
import { tudor } from "./tudor.ts";
import { omega } from "./omega.ts";
import { grandSeiko } from "./grand-seiko.ts";
import { type SourceAdapter } from "./types.ts";
import { venezianico } from "./venezianico.ts";

/**
 * Sources actives. Les sites officiels définissent le catalogue ; les revendeurs y rattachent
 * leurs offres. Lancer les officiels avant les revendeurs (une nouvelle référence doit exister).
 */
export const sources: Record<string, SourceAdapter> = {
  tissot,
  hamilton,
  longines,
  citizen,
  seiko,
  venezianico,
  lip,
  tudor,
  omega,
  "grand-seiko": grandSeiko,
  "tag-heuer": tagHeuer,
  lepage,
  ocarat,
};
