import { Watch } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Image officielle de la marque, affichée depuis son site (docs/decisions.md). Carré à taille fixe
 * pour éviter tout décalage de mise en page (CLS).
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
  return (
    <div className={cn("relative aspect-square overflow-hidden rounded-lg bg-muted", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain p-4 mix-blend-multiply dark:mix-blend-normal"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <Watch className="size-10" aria-hidden />
        </div>
      )}
    </div>
  );
}
