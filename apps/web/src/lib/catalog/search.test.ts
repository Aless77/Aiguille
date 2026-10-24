import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { catalogSearch } from "./search";

const query = (text: string) => new PgDialect().sqlToQuery(catalogSearch(text)!);

describe("recherche du catalogue", () => {
  it("cherche chaque mot et normalise les références ponctuées", () => {
    const result = query("Tissot T137.407-11");
    expect(result.sql).toContain(" and ");
    expect(result.params).toContain("%T13740711%");
    expect(result.params).toContain("%Tissot%");
    expect(result.sql).not.toContain("T137");
  });

  it("échappe les jokers et ne transforme pas une ponctuation seule en référence vide", () => {
    const result = query("%_\\");
    expect(result.params).toContain("%\\%\\_\\\\%");
    expect(result.params).not.toContain("%%");
    expect(catalogSearch("  ")).toBeUndefined();
  });
});
