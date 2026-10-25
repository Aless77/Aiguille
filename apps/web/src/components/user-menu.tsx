"use client";

import { Heart } from "lucide-react";
import { Link, useLocale } from "@/lib/i18n/client";
import { splitLocale } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/dictionary";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

/**
 * Lien de connexion ou compte connecté, dans l'en-tête. Lu côté navigateur : les pages restent
 * statiques et mises en cache, la session n'entre jamais dans le HTML serveur.
 */
export function UserMenu({ showLists = false }: { showLists?: boolean }) {
  const { data, isPending } = authClient.useSession();
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  if (isPending) return <span className="h-7 w-24" aria-hidden />;

  if (!data) {
    const returnTo = splitLocale(pathname).path === "/connexion" ? "/" : pathname;
    return (
      <Link
        href={`/connexion?retour=${encodeURIComponent(returnTo)}`}
        className="text-sm text-muted-foreground hover:text-foreground"
        rel="nofollow"
      >
        {t.signIn}
      </Link>
    );
  }

  const { user } = data;
  return (
    <div className="flex items-center gap-2 text-sm">
      {showLists && (
        <Link
          href="/listes"
          className="text-muted-foreground hover:text-foreground"
          aria-label={t.myLists}
          title={t.myLists}
        >
          <Heart className="size-4" aria-hidden />
        </Link>
      )}
      <Link
        href="/compte"
        className="flex items-center gap-2 hover:text-foreground"
        aria-label={format(t.myAccount, { name: user.name })}
        title={user.email}
      >
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
        <span className="hidden max-w-32 truncate lg:inline">{user.name}</span>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          await authClient.signOut();
          router.refresh();
        }}
      >
        {t.signOut}
      </Button>
    </div>
  );
}
