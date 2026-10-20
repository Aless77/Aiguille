"use client";

import { useEffect, useRef } from "react";

export interface EuropeMapDatum {
  /** Identifiant ISO 3166 numérique du pays (« 250 » pour la France). */
  isoNumeric: string;
  name: string;
  /** Écart avec la France en % (négatif : moins cher). */
  deltaPercent: number;
  label: string;
}

/**
 * Carte de l'Europe colorée selon l'écart de prix avec la France (cahier des charges, lot 4 :
 * « carte par pays »). ECharts et le fond de carte (world-atlas, 110 m) sont chargés à la demande.
 * Les chiffres sont aussi dans le tableau rendu côté serveur.
 */
export function EuropeMap({ data }: { data: EuropeMapDatum[] }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [echarts, charts, components, renderers, topojson, atlas] = await Promise.all([
        import("echarts/core"),
        import("echarts/charts"),
        import("echarts/components"),
        import("echarts/renderers"),
        import("topojson-client"),
        import("world-atlas/countries-110m.json"),
      ]);
      if (disposed) return;
      echarts.use([
        charts.MapChart,
        components.TooltipComponent,
        components.VisualMapComponent,
        renderers.SVGRenderer,
      ]);

      // Le nom de chaque région est son code ISO numérique : appariement direct avec les données.
      const world = atlas.default as unknown as Parameters<typeof topojson.feature>[0];
      const countries = topojson.feature(
        world,
        (world as unknown as { objects: { countries: Parameters<typeof topojson.feature>[1] } })
          .objects.countries,
      ) as unknown as {
        type: "FeatureCollection";
        features: { id?: string; properties: object }[];
      };
      const geo = {
        ...countries,
        features: countries.features.map((f) => ({ ...f, properties: { name: String(f.id) } })),
      };
      echarts.registerMap("europe", geo as never);

      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const byIso = new Map(data.map((d) => [d.isoNumeric, d]));
      const maxDelta = Math.max(5, ...data.map((d) => Math.abs(d.deltaPercent)));

      const chart = echarts.init(element, null, { renderer: "svg" });
      chart.setOption({
        tooltip: {
          trigger: "item",
          formatter: (p: { name: string }) => {
            const d = byIso.get(p.name);
            return d ? `${d.name}<br/>${d.label}` : "Pas de prix relevé";
          },
        },
        visualMap: {
          type: "continuous",
          min: -maxDelta,
          max: maxDelta,
          calculable: false,
          left: 8,
          bottom: 8,
          text: ["Plus cher", "Moins cher"],
          textStyle: { color: dark ? "#a3a3a3" : "#525252" },
          inRange: { color: ["#059669", dark ? "#404040" : "#e5e5e5", "#dc2626"] },
        },
        series: [
          {
            type: "map",
            map: "europe",
            roam: false,
            // Cadrage sur l'Europe (longitude, latitude).
            boundingCoords: [
              [-11, 61],
              [25, 35],
            ],
            itemStyle: {
              areaColor: dark ? "#262626" : "#f5f5f5",
              borderColor: dark ? "#525252" : "#d4d4d4",
            },
            emphasis: { label: { show: false }, itemStyle: { areaColor: "#2563eb" } },
            select: { disabled: true },
            data: data.map((d) => ({ name: d.isoNumeric, value: d.deltaPercent })),
          },
        ],
      });

      const resize = () => chart.resize();
      window.addEventListener("resize", resize);
      cleanup = () => {
        window.removeEventListener("resize", resize);
        chart.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [data]);

  return (
    <div
      ref={container}
      role="img"
      aria-label="Carte des écarts de prix avec la France (le détail figure dans le tableau)"
      className="h-96 w-full"
    />
  );
}
