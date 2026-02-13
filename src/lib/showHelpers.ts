import { Prisma } from "@prisma/client";
import type { Show } from "@/types";

/** Standard Prisma include clause for fetching full show data. */
export const showInclude = {
  genres: { include: { genre: true } },
  reviews: { orderBy: { date: "desc" as const } },
} as const;

/** The Prisma result type when a Show is loaded with `showInclude`. */
export type PrismaShowWithRelations = Prisma.ShowGetPayload<{
  include: typeof showInclude;
}>;

/**
 * Normalize a Prisma show (with genres relation) into the flat shape
 * that components expect: `genre: string[]` instead of `genres: ShowGenre[]`.
 *
 * Accepts the typed Prisma result directly — no cast needed at call sites.
 */
export function normalizeShow(
  show: PrismaShowWithRelations | null,
): Show | null {
  if (!show) return null;
  const { genres, ...rest } = show;
  return {
    ...rest,
    genre: genres?.map((sg) => sg.genre.name) ?? [],
  } as Show;
}
