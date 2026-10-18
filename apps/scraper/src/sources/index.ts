import { hamilton } from "./hamilton.ts";
import { longines } from "./longines.ts";
import { tissot } from "./tissot.ts";
import { type SourceAdapter } from "./types.ts";

/** Sources actives (lot 2 : les trois marques aux données les plus accessibles). */
export const sources: Record<string, SourceAdapter> = {
  tissot,
  hamilton,
  longines,
};
