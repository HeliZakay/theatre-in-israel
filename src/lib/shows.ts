import prisma from "./prisma";
import { getAverageRating, getLatestReviewDate } from "../utils/showStats";
import type { Show, Review } from "@/types";

interface PrismaShowGenre {
  genre: { name: string };
}

interface PrismaShow {
  id: number;
  title: string;
  theatre: string;
  durationMinutes: number;
  summary: string;
  genres: PrismaShowGenre[];
  reviews: Review[];
}

/**
 * Normalize a Prisma show (with genres relation) into the flat shape
 * that components expect: `genre: string[]` instead of
 * `genres: ShowGenre[]`.
 */
function normalizeShow(show: PrismaShow | null): Show | null {
  if (!show) return null;
  const { genres, ...rest } = show;
  return {
    ...rest,
    genre: genres?.map((sg) => sg.genre.name) ?? [],
  };
}

/** Standard include clause used by most queries. */
const showInclude = {
  genres: { include: { genre: true } },
  reviews: { orderBy: { date: "desc" as const } },
};

/**
 * Fetch all shows from the database.
 * Returns normalized show objects matching the original JSON shape.
 */
export async function getShows(): Promise<Show[]> {
  const shows = await prisma.show.findMany({
    include: showInclude,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return shows
    .map((s) => normalizeShow(s as any))
    .filter((s): s is Show => s !== null);
}

interface ReviewInput {
  author: string;
  title?: string | null;
  text: string;
  rating: number;
  date: string;
}

/**
 * Add a review to the specified show.
 * Returns `{ show, review }` or `null` if the show doesn't exist.
 */
export async function addReview(
  showId: string | number,
  review: ReviewInput,
): Promise<{ show: Show; review: Review } | null> {
  const numericId = Number(showId);

  // Verify the show exists.
  const existing = await prisma.show.findUnique({
    where: { id: numericId },
  });

  if (!existing) return null;

  const newReview = await prisma.review.create({
    data: {
      showId: numericId,
      author: review.author,
      title: review.title ?? null,
      text: review.text,
      rating: review.rating,
      date: new Date(review.date),
    },
  });

  // Re-fetch the full show so the caller gets the updated reviews list.
  const updatedShow = await prisma.show.findUnique({
    where: { id: numericId },
    include: showInclude,
  });

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    show: normalizeShow(updatedShow as any) as Show,
    review: newReview as unknown as Review,
  };
}

export { getAverageRating, getLatestReviewDate };
