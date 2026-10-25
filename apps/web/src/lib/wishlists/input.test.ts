import { describe, expect, it } from "vitest";

import {
  commentInput,
  commentLimit,
  COMMENTS_PER_LIST,
  COMMENTS_PER_USER,
  COMMENTS_PER_USER_PER_LIST,
  DAILY_COMMENT_LIMIT,
  SITE_MAX_COMMENTS,
  createListInput,
  isPublic,
  listBudget,
  newShareId,
  SHARE_ID_PATTERN,
  updateListInput,
} from "./input";

describe("newShareId", () => {
  it("produit 12 caractères lisibles, conformes au motif des URL", () => {
    for (let i = 0; i < 50; i++) expect(newShareId()).toMatch(SHARE_ID_PATTERN);
    expect(newShareId(new Uint8Array(12))).toBe("aaaaaaaaaaaa");
  });

  it("ne se répète pas", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newShareId()));
    expect(ids.size).toBe(1000);
  });
});

describe("createListInput", () => {
  it("accepte un nom seul, privée par défaut", () => {
    expect(createListInput.parse({ title: "  Mes envies  " })).toEqual({
      title: "Mes envies",
      visibility: "private",
      anonymous: false,
    });
  });

  it("refuse un nom vide ou un lien", () => {
    expect(createListInput.safeParse({ title: " " }).success).toBe(false);
    expect(createListInput.safeParse({ title: "Voir www.spam.com" }).success).toBe(false);
  });
});

describe("updateListInput", () => {
  it("exige au moins un champ et une visibilité connue", () => {
    expect(updateListInput.safeParse({}).success).toBe(false);
    expect(updateListInput.safeParse({ visibility: "public" }).success).toBe(false);
    expect(updateListInput.parse({ visibility: "community" })).toEqual({
      visibility: "community",
    });
  });
});

describe("commentInput", () => {
  it("valide un avis sur la liste ou sur une montre", () => {
    expect(commentInput.parse({ body: "Belle sélection" }).watchId).toBeUndefined();
    expect(commentInput.parse({ body: "La PRX est un must", watchId: 3 }).watchId).toBe(3);
  });

  it("refuse les liens et les avis vides", () => {
    expect(commentInput.safeParse({ body: "https://pub.example" }).success).toBe(false);
    expect(commentInput.safeParse({ body: " " }).success).toBe(false);
  });
});

describe("isPublic", () => {
  it("seule une liste privée est réservée à son auteur", () => {
    expect(isPublic("private")).toBe(false);
    expect(isPublic("link")).toBe(true);
    expect(isPublic("community")).toBe(true);
  });
});

describe("listBudget", () => {
  it("additionne les prix connus et compte les prix inconnus", () => {
    expect(
      listBudget([{ priceCents: 39500 }, { priceCents: null }, { priceCents: 120000 }]),
    ).toEqual({ count: 3, totalCents: 159500, unknownPrices: 1 });
  });
});

describe("anonymat", () => {
  it("une liste et un avis sont signés par défaut, anonymes sur demande", () => {
    expect(createListInput.parse({ title: "Liste" }).anonymous).toBe(false);
    expect(createListInput.parse({ title: "Liste", anonymous: true }).anonymous).toBe(true);
    expect(commentInput.parse({ body: "Avis", anonymous: true, parentId: 4 })).toMatchObject({
      anonymous: true,
      parentId: 4,
    });
  });
});

describe("commentLimit", () => {
  const ok = { userToday: 0, userTotal: 0, userOnList: 0, onList: 0, site: 0 };

  it("accepte un message sous tous les plafonds", () => {
    expect(commentLimit(ok)).toBeNull();
  });

  it("refuse au-delà de chaque plafond, le site en premier", () => {
    expect(commentLimit({ ...ok, site: SITE_MAX_COMMENTS })).toMatch(/capacité/);
    expect(commentLimit({ ...ok, onList: COMMENTS_PER_LIST })).toMatch(/close/);
    expect(commentLimit({ ...ok, userToday: DAILY_COMMENT_LIMIT })).toMatch(/demain/);
    expect(commentLimit({ ...ok, userOnList: COMMENTS_PER_USER_PER_LIST })).toMatch(/par personne/);
    expect(commentLimit({ ...ok, userTotal: COMMENTS_PER_USER })).toMatch(/par compte/);
  });
});
