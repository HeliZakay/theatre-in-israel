import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { enrichShow } from "@/utils/showStats";
import type { Show, EnrichedShow, ShowListItem } from "@/types";

/** Standard Prisma include clause for fetching full show data. */
export const showInclude = {
  genres: { include: { genre: true } },
  reviews: { orderBy: { date: "desc" as const } },
} as const;

/** Prisma include for list views — genres only, no reviews. */
export const showListInclude = {
  genres: { include: { genre: true } },
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
  const { genres, reviews, ...rest } = show;
  return {
    ...rest,
    genre: genres?.map((sg) => sg.genre.name) ?? [],
    reviews:
      reviews?.map((r) => ({
        ...r,
        date: r.date instanceof Date ? r.date.toISOString() : String(r.date),
      })) ?? [],
  } as Show;
}

/**
 * Fetch shows by an ordered list of IDs, preserving the given order.
 * Shared pipeline: findMany → map-preserve-order → normalizeShow → enrichShow.
 */
export async function fetchShowsByIds(ids: number[]): Promise<EnrichedShow[]> {
  if (ids.length === 0) return [];
  const rawShows = await prisma.show.findMany({
    where: { id: { in: ids } },
    include: showInclude,
  });
  const showMap = new Map(rawShows.map((s) => [s.id, s]));
  return ids
    .map((id) => showMap.get(id))
    .filter(Boolean)
    .map((s) => normalizeShow(s!))
    .filter((s): s is Show => s !== null)
    .map(enrichShow);
}

/**
 * Fetch lightweight show list items by an ordered list of IDs.
 * Loads genres only (no reviews) and computes stats via a single raw SQL query.
 */
export async function fetchShowListItems(
  ids: number[],
): Promise<ShowListItem[]> {
  if (ids.length === 0) return [];

  const rawShows = await prisma.show.findMany({
    where: { id: { in: ids } },
    include: showListInclude,
  });

  const stats = await prisma.$queryRawUnsafe<
    { showId: number; avgRating: number; reviewCount: number }[]
  >(
    `SELECT "showId", AVG(rating)::float AS "avgRating", COUNT(*)::int AS "reviewCount" FROM "Review" WHERE "showId" = ANY($1) GROUP BY "showId"`,
    ids,
  );

  const statsMap = new Map(stats.map((s) => [s.showId, s]));
  const showMap = new Map(rawShows.map((s) => [s.id, s]));

  return ids
    .map((id) => showMap.get(id))
    .filter(Boolean)
    .map((s) => {
      const { genres, ...rest } = s!;
      const stat = statsMap.get(s!.id);
      return {
        ...rest,
        genre: genres?.map((sg) => sg.genre.name) ?? [],
        avgRating: stat?.avgRating ?? null,
        reviewCount: stat?.reviewCount ?? 0,
      } as ShowListItem;
    });
}
