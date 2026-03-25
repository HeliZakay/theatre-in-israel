import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { enrichShow } from "@/utils/showStats";
import type { Show, EnrichedShow, ShowListItem } from "@/types";

/** Hebrew name of the kids genre in the database. */
export const KIDS_GENRE_NAME = "ילדים";

/** Prisma where clause to exclude shows tagged with the kids genre. */
export const excludeKidsWhere: Prisma.ShowWhereInput = {
  genres: { none: { genre: { name: KIDS_GENRE_NAME } } },
};

/** Events include — defined separately to avoid readonly array conflict with Prisma types. */
const eventsInclude = {
  orderBy: { date: "asc" as const },
  include: { venue: true },
};

/** Standard Prisma include clause for fetching full show data. */
export const showInclude = {
  genres: { include: { genre: true } },
  reviews: { orderBy: { date: "desc" as const } },
  events: eventsInclude,
  actors: { include: { actor: true } },
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
  const { genres, reviews, events, actors, ...rest } = show;
  const today = new Date(new Date().toDateString());
  return {
    ...rest,
    genre: genres?.map((sg) => sg.genre.name) ?? [],
    actors: (actors ?? []).map((sa) => ({
      id: sa.actor.id,
      name: sa.actor.name,
      slug: sa.actor.slug,
      image: sa.actor.image,
    })),
    reviews:
      reviews?.map((r) => ({
        ...r,
        date: r.date instanceof Date ? r.date.toISOString() : String(r.date),
      })) ?? [],
    events: (events ?? [])
      .filter((e) => {
        const d = e.date instanceof Date ? e.date : new Date(e.date);
        return d >= today;
      })
      .map((e) => ({
        id: e.id,
        date: e.date instanceof Date ? e.date.toISOString() : String(e.date),
        hour: e.hour,
        venue: {
          name: e.venue.name,
          city: e.venue.city,
          address: e.venue.address,
          regions: e.venue.regions,
        },
      })),
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
 * Loads genres only (no reviews). Stats come from denormalized Show columns.
 */
export async function fetchShowListItems(
  ids: number[],
): Promise<ShowListItem[]> {
  if (ids.length === 0) return [];

  const rawShows = await prisma.show.findMany({
    where: { id: { in: ids } },
    include: showListInclude,
  });

  const showMap = new Map(rawShows.map((s) => [s.id, s]));

  return ids
    .map((id) => showMap.get(id))
    .filter(Boolean)
    .map((s) => {
      const { genres, ...rest } = s!;
      return {
        ...rest,
        genre: genres?.map((sg) => sg.genre.name) ?? [],
      } satisfies ShowListItem;
    });
}
