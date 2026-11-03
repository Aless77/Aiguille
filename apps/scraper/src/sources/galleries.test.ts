import { load } from "cheerio";
import { describe, expect, it } from "vitest";

import { galleryImages } from "./citizen";
import { detailedViews } from "./longines";
import { readImages } from "./omega";
import { readImages as readSeiko } from "./seiko";
import { carouselImages } from "./tissot";

describe("photos des fiches", () => {
  it("Seiko : photo principale puis galerie de la référence, à l'adresse complète", () => {
    const media = "/fr-fr/-/media/Images/Product--Image/All/Seiko/HKF003J1";
    const $ =
      load(`<div class="productInformation-visual"><img src="${media}/HKF003J1.png?mh=1200&amp;mw=1200"></div>
      <div class="productInformation-gallery-inner js-productGallery-photoswipe">
        <a href="${media}/HKF003J1_ima_1_2026.png?mh=1200&amp;mw=1200"></a>
        <a href="${media}/HKF003J1.png?mh=1200&amp;mw=1200"></a>
        <a href="/fr-fr/-/media/SPB279J1.png"></a>
      </div>`);
    const url = "https://www.seikowatches.com/fr-fr/products/kingseiko/hkf003j1";
    expect(readSeiko($, url, "HKF003J1")).toEqual([
      `https://www.seikowatches.com${media}/HKF003J1.png?mh=1200&mw=1200`,
      `https://www.seikowatches.com${media}/HKF003J1_ima_1_2026.png?mh=1200&mw=1200`,
    ]);
  });

  it("Tissot : carrousel à l'adresse d'origine, sans redimensionnement", () => {
    const base = "https://www.tissotwatches.com/dw/image/v2/BKKD_PRD/on/demandware.static/-/S";
    const $ = load(
      `<div class="ti-pdp-carousel-image"><img src="${base}/a_WRIST.png?sw=800"><img src=""></div>
       <img src="${base}/voisine.png?sw=300">`,
    );
    expect(carouselImages($)).toEqual([
      "https://www.tissotwatches.com/on/demandware.static/-/S/a_WRIST.png",
    ]);
  });

  it("Longines : vues détaillées de cette référence, dans l'ordre de la marque", () => {
    const media = "https://api.ecom.longines.com/media/catalog/product/t/h";
    const $ = load(`<img src="${media}/m-l2-449-5-87-7-detailed-view-2000x2000-2-aa11.jpg?w=300">
      <img src="${media}/m-l2-449-5-87-7-detailed-view-2000x2000-1-bb22.jpg">
      <img src="${media}/m-l2-449-5-89-7-detailed-view-2000x2000-1-cc33.jpg">
      <img src="${media}/m-l2-449-5-87-7-google-gallery-dd44.jpg">`);
    expect(detailedViews($, "L2.449.5.87.7")).toEqual([
      `${media}/m-l2-449-5-87-7-detailed-view-2000x2000-1-bb22.jpg`,
      `${media}/m-l2-449-5-87-7-detailed-view-2000x2000-2-aa11.jpg`,
    ]);
  });

  it("Citizen : photos 1 400 px de la référence, pas celles des voisines ni les petites tailles", () => {
    const thumb = "https://fr.citizenwatch.eu/media/thumbs/1f/ef/abc";
    const $ =
      load(`<img src="${thumb}/1400x_crop=center;format=webp/managed/96/a7/h/CA4660-61A_2.png.thumb.webp">
      <img src="${thumb}/360x_crop=center;format=webp/managed/96/a7/h/CA4660-61A_3.png.thumb.webp">
      <img src="${thumb}/1400x_crop=center;format=webp/managed/96/a7/h/CA4660-61B.png.thumb.webp">`);
    expect(galleryImages($, "CA4660-61A")).toEqual([
      `${thumb}/1400x_crop=center;format=webp/managed/96/a7/h/CA4660-61A_2.png.thumb.webp`,
    ]);
  });

  it("Omega : vue principale d'origine, vues numérotées puis porté, sans les voisines", () => {
    const media = "https://www.omegawatches.com/media/catalog/product/o/m";
    const url = "https://www.omegawatches.com/fr-fr/watch-omega-21730422101002";
    const $ = load(`<img src="${media}/o-21730422101002-watch-wrist-ff.png">
      <img src="${media}/o-21730422101002-portrait-10-aa.png?w=500">
      <img src="${media}/o-21730422101002-portrait-2-bb.png">
      <img src="${media}/o-21732422101001-portrait-1-cc.png">`);
    expect(readImages($, url, [`${media}/o-21730422101002-main.png?w=230`])).toEqual([
      `${media}/o-21730422101002-main.png`,
      `${media}/o-21730422101002-portrait-2-bb.png`,
      `${media}/o-21730422101002-portrait-10-aa.png`,
      `${media}/o-21730422101002-watch-wrist-ff.png`,
    ]);
  });
});
