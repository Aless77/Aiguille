import { describe, expect, it } from "vitest";

import { extendTrail, parseTrail, trailPageUrl, trailPosition } from "./trail";
import { PAGE_SIZE } from "./types";

const paths = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => `/montres/tissot/prx/m${from + i}`);

const firstPage = {
  list: "/montres?tri=nom",
  offset: 0,
  paths: paths(0, PAGE_SIZE),
  total: PAGE_SIZE * 2 + 1,
};

describe("parcours du catalogue", () => {
  it("situe une fiche et donne ses voisines", () => {
    expect(trailPosition(firstPage, "/montres/tissot/prx/m3")).toEqual({
      rank: 4,
      previous: "/montres/tissot/prx/m2",
      next: "/montres/tissot/prx/m4",
      missingPage: null,
    });
    expect(trailPosition(firstPage, "/montres/tissot/prx/m0")?.previous).toBeNull();
  });

  it("ignore une fiche hors de la liste", () => {
    expect(trailPosition(firstPage, "/montres/hamilton/khaki/x")).toBeNull();
  });

  it("demande la page suivante au bord de la liste connue", () => {
    const last = trailPosition(firstPage, `/montres/tissot/prx/m${PAGE_SIZE - 1}`);
    expect(last).toMatchObject({ next: null, missingPage: 2 });
  });

  it("demande la page précédente quand le parcours commence plus loin", () => {
    const second = { ...firstPage, offset: PAGE_SIZE, paths: paths(PAGE_SIZE, PAGE_SIZE) };
    const first = trailPosition(second, `/montres/tissot/prx/m${PAGE_SIZE}`);
    expect(first).toMatchObject({ rank: PAGE_SIZE + 1, previous: null, missingPage: 1 });
  });

  it("ne demande rien à la dernière montre de la liste", () => {
    const short = { ...firstPage, paths: paths(0, 3), total: 3 };
    expect(trailPosition(short, "/montres/tissot/prx/m2")).toMatchObject({
      next: null,
      missingPage: null,
    });
  });

  it("colle les pages voisines et ignore une page sans lien avec le parcours", () => {
    const after = extendTrail(firstPage, {
      offset: PAGE_SIZE,
      paths: paths(PAGE_SIZE, 2),
      total: firstPage.total,
    });
    expect(after.paths).toHaveLength(PAGE_SIZE + 2);

    const before = extendTrail(
      { ...firstPage, offset: PAGE_SIZE, paths: paths(PAGE_SIZE, 2) },
      { offset: 0, paths: paths(0, PAGE_SIZE), total: firstPage.total },
    );
    expect(before).toMatchObject({ offset: 0 });
    expect(before.paths).toHaveLength(PAGE_SIZE + 2);

    const unrelated = { offset: PAGE_SIZE * 5, paths: paths(0, 1), total: 9 };
    expect(extendTrail(firstPage, unrelated)).toBe(firstPage);
  });

  it("garde les filtres dans la demande de page", () => {
    expect(trailPageUrl(firstPage, 2)).toBe(
      "/api/catalogue/parcours?tri=nom&liste=%2Fmontres&page=2",
    );
  });

  it("rejette un parcours stocké invalide", () => {
    expect(parseTrail("{pas du json")).toBeNull();
    expect(parseTrail('{"list":"x"}')).toBeNull();
    expect(parseTrail(JSON.stringify(firstPage))).toEqual(firstPage);
  });
});
