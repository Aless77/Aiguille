/**
 * Mise en forme publique d'une liste : qui est affiché sous quel nom. Seul ce résultat quitte le
 * serveur ; les identifiants de compte, noms et photos des membres anonymes n'en sortent jamais.
 */

export interface Person {
  name: string;
  image: string | null;
  anonymous: boolean;
  /** Message de l'auteur de la liste : signalé partout, même anonyme. */
  listAuthor: boolean;
}

export interface CommentRow {
  id: number;
  userId: string;
  userName: string;
  userImage: string | null;
  anonymous: boolean;
  parentId: number | null;
  body: string;
  createdAt: Date;
  watchId: number | null;
}

export interface PresentedComment<W> {
  id: number;
  body: string;
  createdAt: Date;
  author: Person;
  watch: W | null;
  replies: PresentedComment<W>[];
}

interface ListOwner {
  id: number;
  userId: string;
  userName: string;
  userImage: string | null;
  anonymous: boolean;
}

export const ANONYMOUS_OWNER = "Auteur anonyme";
export const OWNER_LABEL = "Auteur de la liste";

/** Auteur de la liste tel qu'affiché en tête de page et dans le forum. */
export function presentOwner(list: ListOwner): Person {
  return list.anonymous
    ? { name: ANONYMOUS_OWNER, image: null, anonymous: true, listAuthor: true }
    : { name: list.userName, image: list.userImage, anonymous: false, listAuthor: true };
}

/**
 * Avis publiés d'une liste, en fil : avis puis leurs réponses (un niveau), dans l'ordre. Une
 * réponse dont l'avis a été masqué remonte au premier niveau plutôt que de disparaître.
 */
export function presentComments<W>(
  list: ListOwner,
  rows: CommentRow[],
  watchOf: (watchId: number | null) => W | null,
  pseudonymOf: (userId: string) => string,
): PresentedComment<W>[] {
  const person = (row: CommentRow): Person => {
    if (row.userId === list.userId) {
      // L'auteur d'une liste anonyme reste anonyme dans la discussion, quel que soit son choix.
      return row.anonymous || list.anonymous
        ? { name: OWNER_LABEL, image: null, anonymous: true, listAuthor: true }
        : { name: row.userName, image: row.userImage, anonymous: false, listAuthor: true };
    }
    return row.anonymous
      ? { name: pseudonymOf(row.userId), image: null, anonymous: true, listAuthor: false }
      : { name: row.userName, image: row.userImage, anonymous: false, listAuthor: false };
  };

  const byId = new Map<number, PresentedComment<W>>();
  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      body: row.body,
      createdAt: row.createdAt,
      author: person(row),
      watch: watchOf(row.watchId),
      replies: [],
    });
  }
  const threads: PresentedComment<W>[] = [];
  for (const row of rows) {
    const comment = byId.get(row.id)!;
    const parent = row.parentId !== null ? byId.get(row.parentId) : undefined;
    if (parent) parent.replies.push(comment);
    else threads.push(comment);
  }
  return threads;
}

/** Nombre total de messages (avis et réponses). */
export function countComments(threads: { replies: unknown[] }[]): number {
  return threads.reduce((n, t) => n + 1 + t.replies.length, 0);
}
