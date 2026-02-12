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
  userId?: string;
}

export interface OwnedReview {
  id: number;
  showId: number;
  userId: string | null;
  author: string;
  title: string | null;
  text: string;
  rating: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  show: {
    id: number;
    title: string;
  };
}

interface ReviewUpdateInput {
  title?: string | null;
  text: string;
  rating: number;
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
      userId: review.userId,
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

export async function getReviewsByUser(userId: string): Promise<OwnedReview[]> {
  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      show: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });

  return reviews;
}

export async function getReviewByOwner(
  reviewId: number,
  userId: string,
): Promise<OwnedReview | null> {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId },
    include: {
      show: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return review;
}

export async function updateReviewByOwner(
  reviewId: number,
  userId: string,
  review: ReviewUpdateInput,
): Promise<OwnedReview | null> {
  const existing = await prisma.review.findFirst({
    where: { id: reviewId, userId },
    select: { id: true },
  });

  if (!existing) return null;

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      title: review.title ?? null,
      text: review.text,
      rating: review.rating,
    },
    include: {
      show: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return updated;
}

export async function deleteReviewByOwner(
  reviewId: number,
  userId: string,
): Promise<boolean> {
  const deleted = await prisma.review.deleteMany({
    where: { id: reviewId, userId },
  });

  return deleted.count > 0;
}

export { getAverageRating, getLatestReviewDate };
