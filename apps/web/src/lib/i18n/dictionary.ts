import { type Locale } from "./config";
import { de } from "./dictionaries/de";
import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import { type Dictionary, fr } from "./dictionaries/fr";
import { it } from "./dictionaries/it";

export type { Dictionary };

type DeepPartial<T> = { [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]> };
/** Dictionnaire d'une langue secondaire : les clés absentes s'affichent en anglais. */
export type PartialDictionary = DeepPartial<Dictionary>;

const PARTIALS: Record<Exclude<Locale, "fr" | "en">, PartialDictionary> = { de, it, es };

type Tree = { [key: string]: string | Tree };

/** Fusionne `over` sur `base` et note les clés de `base` absentes de `over`. */
function merge(base: Tree, over: Tree | undefined, path: string, missing: string[]): Tree {
  const out: Tree = {};
  for (const [key, value] of Object.entries(base)) {
    const own = over?.[key];
    if (typeof value === "string") {
      if (typeof own === "string") out[key] = own;
      else {
        out[key] = value;
        missing.push(`${path}${key}`);
      }
    } else {
      out[key] = merge(value, typeof own === "object" ? own : undefined, `${path}${key}.`, missing);
    }
  }
  return out;
}

export interface ResolvedDictionary {
  dict: Dictionary;
  /** Clés affichées en anglais faute de traduction (avertissement sur la page). */
  missing: string[];
}

export function resolveDictionary(locale: Locale): ResolvedDictionary {
  if (locale === "fr") return { dict: fr, missing: [] };
  if (locale === "en") return { dict: en, missing: [] };
  const missing: string[] = [];
  const dict = merge(en as unknown as Tree, PARTIALS[locale] as Tree, "", missing);
  return { dict: dict as unknown as Dictionary, missing };
}

/** Remplace les variables « {nom} » d'un texte. */
export function format(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/** Libellé traduit d'une table indexée par le texte français ; le français sinon. */
export function translateLabel(table: Record<string, string>, french: string): string {
  return table[french] ?? french;
}
