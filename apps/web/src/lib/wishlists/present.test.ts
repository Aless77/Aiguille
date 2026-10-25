import { describe, expect, it } from "vitest";

import {
  ANONYMOUS_OWNER,
  type CommentRow,
  countComments,
  OWNER_LABEL,
  presentComments,
  presentOwner,
} from "./present";

const list = { id: 7, userId: "alice", userName: "Alice", userImage: "a.png", anonymous: false };
const anonymousList = { ...list, anonymous: true };

let nextId = 1;
function row(over: Partial<CommentRow> & { userId: string }): CommentRow {
  return {
    id: nextId++,
    userName: over.userId.toUpperCase(),
    userImage: `${over.userId}.png`,
    anonymous: false,
    parentId: null,
    body: "Message",
    createdAt: new Date("2026-10-25"),
    watchId: null,
    ...over,
  };
}

const pseudo = (userId: string) => `Pseudo-${userId.length}`;
const noWatch = () => null;

describe("presentOwner", () => {
  it("masque nom et photo d'une liste anonyme", () => {
    expect(presentOwner(anonymousList)).toEqual({
      name: ANONYMOUS_OWNER,
      image: null,
      anonymous: true,
      listAuthor: true,
    });
    expect(presentOwner(list).name).toBe("Alice");
  });
});

describe("presentComments", () => {
  it("signale l'auteur de la liste et cache les membres anonymes sous un pseudonyme", () => {
    const [own, anon, named] = presentComments(
      list,
      [
        row({ userId: "alice" }),
        row({ userId: "bob", anonymous: true }),
        row({ userId: "carole" }),
      ],
      noWatch,
      pseudo,
    );
    expect(own!.author).toMatchObject({ name: "ALICE", listAuthor: true, anonymous: false });
    expect(anon!.author).toEqual({
      name: "Pseudo-3",
      image: null,
      anonymous: true,
      listAuthor: false,
    });
    expect(named!.author).toMatchObject({ name: "CAROLE", image: "carole.png", listAuthor: false });
  });

  it("garde l'auteur d'une liste anonyme anonyme dans la discussion", () => {
    const [own] = presentComments(anonymousList, [row({ userId: "alice" })], noWatch, pseudo);
    expect(own!.author).toEqual({
      name: OWNER_LABEL,
      image: null,
      anonymous: true,
      listAuthor: true,
    });
    expect(JSON.stringify(own)).not.toContain("Alice");
  });

  it("range les réponses sous leur avis, et remonte celles d'un avis masqué", () => {
    const first = row({ userId: "bob" });
    const reply = row({ userId: "alice", parentId: first.id });
    const orphan = row({ userId: "carole", parentId: 999 });
    const threads = presentComments(list, [first, reply, orphan], noWatch, pseudo);
    expect(threads.map((t) => [t.id, t.replies.map((r) => r.id)])).toEqual([
      [first.id, [reply.id]],
      [orphan.id, []],
    ]);
    expect(countComments(threads)).toBe(3);
  });
});

describe("réponse anonyme", () => {
  it("l'auteur d'une liste signée peut répondre sans son nom", () => {
    const first = row({ userId: "bob" });
    const reply = row({ userId: "alice", parentId: first.id, anonymous: true });
    const [thread] = presentComments(list, [first, reply], noWatch, pseudo);
    expect(thread!.replies[0]!.author).toEqual({
      name: OWNER_LABEL,
      image: null,
      anonymous: true,
      listAuthor: true,
    });
  });

  it("un membre peut répondre anonymement après un message signé", () => {
    const signed = row({ userId: "bob" });
    const reply = row({ userId: "bob", parentId: signed.id, anonymous: true });
    const [thread] = presentComments(list, [signed, reply], noWatch, pseudo);
    expect(thread!.author.name).toBe("BOB");
    expect(thread!.replies[0]!.author).toMatchObject({ name: "Pseudo-3", image: null });
  });
});
