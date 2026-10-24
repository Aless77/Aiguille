"use client";

import { Watch } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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
  className,
}: {
  src: string | null;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
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
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className="object-contain p-4 mix-blend-multiply dark:mix-blend-normal"
        />
      ) : (
        <div
          role="img"
          aria-label={failed ? `${alt} (photo indisponible)` : alt}
          className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground"
        >
          <Watch className="size-10" aria-hidden />
          {failed && <span className="text-xs">Photo indisponible</span>}
        </div>
      )}
    </div>
  );
}
