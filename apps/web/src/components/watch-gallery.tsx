"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, Loader2, Minus, Plus, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { WatchImage } from "@/components/watch-image";
import { GALLERY_WIDTH, sizedImage, ZOOM_WIDTH } from "@/lib/catalog/image-url";
import { useLocale } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

/** Niveaux de zoom du plein écran. */
const ZOOM_LEVELS = [1, 2.5, 4];
/** Déplacement du doigt, en pixels, qui change de photo. */
const SWIPE = 40;

const roundButton =
  "flex size-10 items-center justify-center rounded-full border bg-background/90 text-foreground shadow-sm hover:bg-muted disabled:opacity-40";

/**
 * Photos d'une montre : photo principale, miniatures et glissement, puis plein écran avec zoom.
 * La première photo est rendue par le serveur. Les sites des marques peuvent mettre plusieurs
 * secondes à répondre : la photo affichée reste en place jusqu'au chargement de la suivante, et
 * les deux voisines sont préchargées.
 */
export function WatchGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const [zoomReady, setZoomReady] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [origin, setOrigin] = useState("50% 50%");
  const touchStart = useRef<number | null>(null);
  const t = useLocale().t.gallery;
  const count = images.length;
  const several = count > 1;

  const show = useCallback(
    (next: number) => {
      setIndex((next + count) % count);
      setZoom(0);
      setOrigin("50% 50%");
    },
    [count],
  );

  useEffect(() => {
    if (count < 2) return;
    for (const neighbour of [index + 1, index - 1]) {
      new window.Image().src = sizedImage(images[(neighbour + count) % count]!, GALLERY_WIDTH);
    }
  }, [images, index, count]);

  const onSwipeEnd = (x: number) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (start === null || !several || Math.abs(x - start) < SWIPE) return;
    show(index + (x < start ? 1 : -1));
  };

  /** Le point visé reste sous le pointeur : souris ou doigt déplacent la zone agrandie. */
  const aim = (event: MouseEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 100;
    const y = ((event.clientY - box.top) / box.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  /** Les flèches changent de photo ici, pas de montre (feuilletage de la fiche). */
  const onKeyDown = (event: KeyboardEvent) => {
    const step = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    if (step && several) {
      event.stopPropagation();
      show(index + step);
    }
    if (open && (event.key === "+" || event.key === "=")) {
      setZoom((z) => Math.min(z + 1, ZOOM_LEVELS.length - 1));
    }
    if (open && event.key === "-") setZoom((z) => Math.max(z - 1, 0));
  };

  if (count === 0) return <WatchImage src={null} alt={alt} />;

  const src = images[index]!;
  const position = format(t.position, { index: index + 1, total: count });
  const zoomed = zoom > 0;

  return (
    <div className="space-y-3" onKeyDown={onKeyDown}>
      <div
        className="relative touch-pan-y"
        onTouchStart={(event) => (touchStart.current = event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => onSwipeEnd(event.changedTouches[0]?.clientX ?? 0)}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.open}
          className="group block w-full cursor-zoom-in rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <WatchImage
            key={images[shown]}
            src={images[shown]!}
            width={GALLERY_WIDTH}
            alt={several ? `${alt} – ${position}` : alt}
            priority={shown === 0}
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          {shown !== index && (
            <>
              <WatchImage
                key={src}
                src={src}
                width={GALLERY_WIDTH}
                alt=""
                sizes="(min-width: 768px) 50vw, 100vw"
                onSettled={() => setShown(index)}
                className="absolute inset-0 opacity-0"
              />
              <Loader2
                className="absolute top-1/2 left-1/2 size-6 -translate-1/2 animate-spin text-muted-foreground"
                aria-hidden
              />
            </>
          )}
          <span className="absolute right-2 bottom-2 flex size-9 items-center justify-center rounded-full bg-background/90 opacity-80 shadow-sm group-hover:opacity-100">
            <ZoomIn className="size-4" aria-hidden />
          </span>
        </button>
        {several && (
          <>
            <button
              type="button"
              aria-label={t.previous}
              onClick={() => show(index - 1)}
              className={cn(roundButton, "absolute top-1/2 left-2 -translate-y-1/2")}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={t.next}
              onClick={() => show(index + 1)}
              className={cn(roundButton, "absolute top-1/2 right-2 -translate-y-1/2")}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <p
              aria-live="polite"
              className="absolute top-2 right-2 rounded-full bg-background/90 px-2 py-0.5 text-xs tabular-nums"
            >
              {position}
            </p>
          </>
        )}
      </div>

      {several && (
        <ul aria-label={t.label} className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <li key={image} className="shrink-0">
              <button
                type="button"
                onClick={() => show(i)}
                aria-current={i === index ? "true" : undefined}
                aria-label={format(t.position, { index: i + 1, total: count })}
                className={cn(
                  "block size-16 overflow-hidden rounded-md border-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  i === index ? "border-foreground" : "border-transparent hover:border-border",
                )}
              >
                <WatchImage src={image} width={200} alt="" sizes="64px" className="[&_img]:p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          setZoom(0);
        }}
      >
        <Dialog.Portal>
          <Dialog.Popup
            aria-label={t.label}
            className="fixed inset-0 z-50 flex flex-col bg-background outline-none"
          >
            <div className="flex items-center justify-between gap-2 border-b p-2">
              <p aria-live="polite" className="px-2 text-sm tabular-nums">
                {several ? position : null}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={t.zoomOut}
                  disabled={!zoomed}
                  onClick={() => setZoom((z) => z - 1)}
                  className={roundButton}
                >
                  <Minus className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={t.zoomIn}
                  disabled={zoom === ZOOM_LEVELS.length - 1}
                  onClick={() => setZoom((z) => z + 1)}
                  className={roundButton}
                >
                  <Plus className="size-4" aria-hidden />
                </button>
                <Dialog.Close aria-label={t.close} className={roundButton}>
                  <X className="size-4" aria-hidden />
                </Dialog.Close>
              </div>
            </div>

            <div
              className={cn(
                "relative min-h-0 flex-1 overflow-hidden",
                zoomed ? "cursor-zoom-out touch-none" : "cursor-zoom-in touch-pan-y",
              )}
              onPointerMove={(event) => zoomed && aim(event)}
              onPointerDown={(event) => zoomed && aim(event)}
              onClick={(event) => {
                aim(event);
                setZoom(zoomed ? 0 : 1);
              }}
              onTouchStart={(event) => {
                if (!zoomed) touchStart.current = event.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                if (!zoomed) onSwipeEnd(event.changedTouches[0]?.clientX ?? 0);
              }}
            >
              <Image
                key={src}
                src={sizedImage(src, ZOOM_WIDTH)}
                alt={several ? `${alt} – ${position}` : alt}
                fill
                sizes="100vw"
                onLoad={() => setZoomReady(src)}
                className="object-contain transition-transform duration-150"
                style={{ transform: `scale(${ZOOM_LEVELS[zoom]})`, transformOrigin: origin }}
              />
              {zoomReady !== src && (
                <Loader2
                  className="absolute top-1/2 left-1/2 size-8 -translate-1/2 animate-spin text-muted-foreground"
                  aria-hidden
                />
              )}
              {several && !zoomed && (
                <>
                  <button
                    type="button"
                    aria-label={t.previous}
                    onClick={(event) => {
                      event.stopPropagation();
                      show(index - 1);
                    }}
                    className={cn(roundButton, "absolute top-1/2 left-3 -translate-y-1/2")}
                  >
                    <ChevronLeft className="size-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={t.next}
                    onClick={(event) => {
                      event.stopPropagation();
                      show(index + 1);
                    }}
                    className={cn(roundButton, "absolute top-1/2 right-3 -translate-y-1/2")}
                  >
                    <ChevronRight className="size-5" aria-hidden />
                  </button>
                </>
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
