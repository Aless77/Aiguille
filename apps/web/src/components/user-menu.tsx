"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

/**
 * Lien de connexion ou compte connecté, dans l'en-tête. Lu côté navigateur : les pages restent
 * statiques et mises en cache, la session n'entre jamais dans le HTML serveur.
 */
export function UserMenu() {
  const { data, isPending } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();

  if (isPending) return <span className="h-7 w-24" aria-hidden />;

  if (!data) {
    const returnTo = pathname === "/connexion" ? "/" : pathname;
    return (
      <Link
        href={`/connexion?retour=${encodeURIComponent(returnTo)}`}
        className="text-sm text-muted-foreground hover:text-foreground"
        rel="nofollow"
      >
        Se connecter
      </Link>
    );
  }

  const { user } = data;
  return (
    <div className="flex items-center gap-2 text-sm">
      {user.image ? (
        // Avatar fourni par Google ou GitHub : petite image externe, sans optimisation.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image}
          alt=""
          width={24}
          height={24}
          className="size-6 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : null}
      <span className="hidden max-w-32 truncate lg:inline" title={user.email}>
        {user.name}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          await authClient.signOut();
          router.refresh();
        }}
      >
        Se déconnecter
      </Button>
    </div>
  );
}
