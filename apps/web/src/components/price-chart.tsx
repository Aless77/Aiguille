"use client";

import { useEffect, useRef } from "react";

import { type PriceSeries } from "@/lib/catalog/price-history";

const COLORS = ["#2563eb", "#d97706", "#059669", "#db2777", "#7c3aed"];

const euros = (cents: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);

/**
 * Courbe des prix par source (ECharts, chargé à la demande pour ne pas alourdir les autres pages).
 * Les chiffres essentiels sont aussi rendus en texte côté serveur (PriceHistorySection) : le
 * graphique n'est qu'une aide visuelle, invisible pour les moteurs.
 */
export function PriceChart({ series }: { series: PriceSeries[] }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [echarts, charts, components, renderers] = await Promise.all([
        import("echarts/core"),
        import("echarts/charts"),
        import("echarts/components"),
        import("echarts/renderers"),
      ]);
      if (disposed) return;
      echarts.use([
        charts.LineChart,
        components.GridComponent,
        components.TooltipComponent,
        components.LegendComponent,
        renderers.SVGRenderer,
      ]);

      const style = getComputedStyle(document.documentElement);
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const text = dark ? "#a3a3a3" : "#525252";
      const grid = dark ? "#262626" : "#e5e5e5";

      const chart = echarts.init(element, null, { renderer: "svg" });
      chart.setOption({
        textStyle: { fontFamily: style.fontFamily },
        color: COLORS,
        grid: {
          left: 8,
          right: 16,
          top: series.length > 1 ? 36 : 16,
          bottom: 8,
          containLabel: true,
        },
        legend: series.length > 1 ? { top: 0, textStyle: { color: text } } : undefined,
        tooltip: {
          trigger: "axis",
          valueFormatter: (value: unknown) => (typeof value === "number" ? euros(value) : "—"),
        },
        xAxis: {
          type: "time",
          // Graduation au jour au minimum : les relevés sont quotidiens.
          minInterval: 86_400_000,
          axisLabel: { color: text, hideOverlap: true },
          axisLine: { lineStyle: { color: grid } },
        },
        yAxis: {
          type: "value",
          scale: true,
          axisLabel: { color: text, formatter: (v: number) => euros(v) },
          splitLine: { lineStyle: { color: grid } },
        },
        series: series.map((s) => ({
          name: s.label,
          type: "line",
          // Paliers : le prix reste constant jusqu'au changement suivant.
          step: "end",
          showSymbol: s.points.length <= 2,
          data: s.points.map((p) => [p.date, p.priceCents]),
        })),
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
  }, [series]);

  return (
    <div
      ref={container}
      role="img"
      aria-label="Graphique de l'évolution du prix (le détail figure dans le tableau ci-dessous)"
      className="h-64 w-full"
    />
  );
}
