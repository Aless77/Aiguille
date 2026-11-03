"use client";

import { Watch } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { sizedImage } from "@/lib/catalog/image-url";
import { useLocale } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

/**
 * Image officielle de la marque, affichée depuis son site (docs/decisions.md). Carré à taille fixe
 * pour éviter tout décalage de mise en page (CLS). Si le site de la marque refuse l'image (panne,
 * filtrage), un visuel neutre la remplace au lieu du texte alternatif débordant.
 */
export function WatchImage({
  src,
  alt,
  priority = false,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  width = 450,
  onSettled,
  className,
}: {
  src: string | null;
  alt: string;
  priority?: boolean;
  sizes?: string;
  /** Largeur demandée au site de la marque, quand il sait redimensionner. */
  width?: number;
  /** Appelé quand la photo est chargée, ou a échoué. */
  onSettled?: () => void;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const t = useLocale().dict.community.misc;
  const img = useRef<HTMLImageElement>(null);

  // Une image en erreur avant l'hydratation n'a pas déclenché onError : on le vérifie ici.
  useEffect(() => {
    const el = img.current;
    if (el?.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);

  return (
    <div className={cn("relative aspect-square overflow-hidden rounded-lg bg-muted", className)}>
      {src && !failed ? (
        <Image
          ref={img}
          src={sizedImage(src, width)}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={onSettled}
          onError={() => {
            setFailed(true);
            onSettled?.();
          }}
          className="object-contain p-4 mix-blend-multiply dark:mix-blend-normal"
        />
      ) : (
        <div
          role="img"
          aria-label={failed ? format(t.photoUnavailableAlt, { alt }) : alt}
          className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground"
        >
          <Watch className="size-10" aria-hidden />
          {failed && <span className="text-xs">{t.photoUnavailable}</span>}
        </div>
      )}
    </div>
  );
}
