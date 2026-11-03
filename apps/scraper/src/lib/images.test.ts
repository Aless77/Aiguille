import { describe, expect, it } from "vitest";

import { byImageRank, imagesInHtml, uniqueImages } from "./images";

describe("uniqueImages", () => {
  it("écarte la même photo servie à deux tailles et garde l'ordre", () => {
    expect(
      uniqueImages([
        "https://exemple.test/a/hero.png",
        "https://exemple.test/b/detail.png?w=300",
        "https://exemple.test/c/hero.png?w=1024",
      ]),
    ).toEqual(["https://exemple.test/a/hero.png", "https://exemple.test/b/detail.png?w=300"]);
  });
});

describe("imagesInHtml", () => {
  it("trouve les adresses du motif, sans leurs paramètres", () => {
    const html = `<img src="https://exemple.test/p/a.png?w=230"><a href="https://exemple.test/x/b.png">`;
    expect(imagesInHtml(html, /https:\/\/exemple\.test\/p\/[^"?]+/g)).toEqual([
      "https://exemple.test/p/a.png",
    ]);
  });
});

describe("byImageRank", () => {
  it("trie par rang numérique et laisse les photos sans rang à la fin", () => {
    const rank = (url: string) => /-(\d+)\.png$/.exec(url)?.[1];
    expect(["wrist.png", "p-10.png", "p-2.png"].sort(byImageRank(rank))).toEqual([
      "p-2.png",
      "p-10.png",
      "wrist.png",
    ]);
  });
});
