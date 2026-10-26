"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { type GeoJSONSource, type Map as MapLibreMap, type Popup } from "maplibre-gl";
import { useEffect, useRef } from "react";

import { useIsDarkTheme } from "@/components/use-theme";
import { type StoreBounds, storeMapsUrl } from "@/lib/catalog/stores";
import { useLocale } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";

export interface StoreMapPoint {
  name: string;
  address: string;
  brandName: string;
  latitude: number;
  longitude: number;
}

const STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

/** Nos calques, à reporter sur le nouveau fond de carte quand le thème change. */
const STORE_LAYERS = ["clusters", "cluster-count", "store"];

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Carte des boutiques agréées (cahier des charges, lot 4), avec regroupement des points proches.
 * MapLibre et le fond de carte OpenFreeMap (gratuit, sans clé) sont chargés à la demande.
 * La liste des boutiques est aussi rendue côté serveur, sous la carte.
 */
export function StoresMap({
  points,
  onBoundsChange,
  resetView = 0,
}: {
  points: StoreMapPoint[];
  onBoundsChange?: (bounds: StoreBounds) => void;
  resetView?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const pointsRef = useRef(points);
  const boundsCallback = useRef(onBoundsChange);
  const dark = useIsDarkTheme();
  const { dict } = useLocale();
  const t = dict.community.stores;
  // Textes lus par la carte, créée une seule fois (la langue ne change pas sans rechargement).
  const texts = useRef({ ...t, newTab: dict.common.newTab });
  const darkRef = useRef(dark);

  // Changement de thème : nouveau fond de carte, en reprenant nos points et nos calques.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      // Carte pas encore créée : elle prendra directement le bon fond.
      darkRef.current = dark;
      return;
    }
    if (darkRef.current === dark) return;
    darkRef.current = dark;
    map.setStyle(dark ? STYLES.dark : STYLES.light, {
      transformStyle: (previous, next) => ({
        ...next,
        sources: { ...next.sources, ...(previous ? { stores: previous.sources.stores! } : {}) },
        layers: [
          ...next.layers,
          ...(previous?.layers.filter((layer) => STORE_LAYERS.includes(layer.id)) ?? []),
        ],
      }),
    });
  }, [dark]);

  useEffect(() => {
    boundsCallback.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    pointsRef.current = points;
    popupRef.current?.remove();
    const map = mapRef.current;
    if (map?.getSource("stores")) updatePoints(map, points);
  }, [points, resetView]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const maplibre = await import("maplibre-gl");
      if (disposed) return;

      const map = new maplibre.Map({
        container: element,
        style: darkRef.current ? STYLES.dark : STYLES.light,
        // Europe par défaut, puis cadrage sur les boutiques affichées.
        center: [8, 49],
        zoom: 3.4,
        attributionControl: { compact: true },
        locale: {
          "Popup.Close": texts.current.closePopup,
          "NavigationControl.ZoomIn": "Zoomer",
          "NavigationControl.ZoomOut": "Dézoomer",
        },
      });
      mapRef.current = map;
      let boundsFrame: number | undefined;
      map.on("moveend", () => {
        // Un recadrage interrompt d'abord l'animation précédente : ne publier que la zone finale.
        if (boundsFrame !== undefined) cancelAnimationFrame(boundsFrame);
        boundsFrame = requestAnimationFrame(() => {
          const bounds = map.getBounds();
          boundsCallback.current?.({
            west: bounds.getWest(),
            east: bounds.getEast(),
            south: bounds.getSouth(),
            north: bounds.getNorth(),
          });
        });
      });
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
      // Le style OpenFreeMap référence des icônes absentes de son sprite (« circle-11 »…) : on les
      // remplace par une image transparente pour éviter les avertissements en console.
      map.on("styleimagemissing", ({ id }) => {
        if (!map.hasImage(id)) map.addImage(id, { width: 1, height: 1, data: new Uint8Array(4) });
      });

      map.on("load", () => {
        map.addSource("stores", {
          type: "geojson",
          cluster: true,
          clusterRadius: 40,
          clusterMaxZoom: 11,
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "stores",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#2563eb",
            "circle-opacity": 0.85,
            "circle-radius": ["step", ["get", "point_count"], 14, 20, 18, 100, 24],
          },
        });
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "stores",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 12,
            // Police fournie par OpenFreeMap (la police par défaut de MapLibre n'y existe pas).
            "text-font": ["Noto Sans Regular"],
          },
          paint: { "text-color": "#ffffff" },
        });
        map.addLayer({
          id: "store",
          type: "circle",
          source: "stores",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#2563eb",
            "circle-radius": 6,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        updatePoints(map, pointsRef.current);

        map.on("click", "clusters", async (event) => {
          const feature = event.features?.[0];
          if (!feature || feature.geometry.type !== "Point") return;
          const source = map.getSource("stores") as GeoJSONSource;
          const zoom = await source.getClusterExpansionZoom(feature.properties.cluster_id);
          map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom });
        });
        map.on("click", "store", (event) => {
          const feature = event.features?.[0];
          if (!feature || feature.geometry.type !== "Point") return;
          const { name, address, brand } = feature.properties as Record<string, string>;
          const coordinates = feature.geometry.coordinates as [number, number];
          // Réserver la partie haute de la carte à la fiche, même sur un petit écran.
          map.panTo(coordinates, { offset: [0, 100], duration: 250 });
          popupRef.current?.remove();
          popupRef.current = new maplibre.Popup({
            offset: 10,
            anchor: "bottom",
            className: "store-popup",
            maxWidth: "280px",
          })
            .setLngLat(feature.geometry.coordinates as [number, number])
            .setHTML(
              `<div class="store-popup-details"><strong>${escapeHtml(name ?? "")}</strong><p>${escapeHtml(address ?? "")}</p><p>${escapeHtml(format(texts.current.authorised, { brand: brand ?? "" }))}</p><p>${escapeHtml(texts.current.stockWarning)}</p><a href="${escapeHtml(storeMapsUrl(name ?? "", address ?? ""))}" target="_blank" rel="noopener noreferrer">${escapeHtml(texts.current.maps)}<span class="sr-only"> ${escapeHtml(texts.current.newTab)}</span></a></div>`,
            )
            .addTo(map);
        });
        for (const layer of ["clusters", "store"]) {
          map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
        }
      });

      cleanup = () => {
        if (boundsFrame !== undefined) cancelAnimationFrame(boundsFrame);
        mapRef.current = null;
        popupRef.current?.remove();
        map.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={container}
      role="region"
      aria-label={format(t.mapLabel, { count: points.length })}
      className="h-[28rem] w-full overflow-hidden rounded-xl border bg-muted"
    />
  );
}

/** Met à jour la source et le cadrage sans recréer la carte pendant la saisie. */
function updatePoints(map: MapLibreMap, points: StoreMapPoint[]) {
  const source = map.getSource("stores") as GeoJSONSource;
  source.setData({
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },
      properties: { name: point.name, address: point.address, brand: point.brandName },
    })),
  });
  if (points.length === 0) return;
  const longitudes = points.map((point) => point.longitude);
  const latitudes = points.map((point) => point.latitude);
  map.fitBounds(
    [
      [Math.min(...longitudes), Math.min(...latitudes)],
      [Math.max(...longitudes), Math.max(...latitudes)],
    ],
    { padding: 40, maxZoom: 12, duration: 0 },
  );
}
