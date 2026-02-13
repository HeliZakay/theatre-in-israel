import prisma from "./prisma";
import type { Review } from "@/types";

/**
 * Fetch only id and title for show picker dropdowns/comboboxes.
 * Much lighter than getShows() which loads all reviews.
 */
export async function getShowOptions(): Promise<
  { id: number; title: string }[]
> {
  return prisma.show.findMany({
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });
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
 * Throws on FK violation (show not found) or unique constraint (duplicate review).
 */
export async function addReview(
  showId: number,
  review: ReviewInput,
): Promise<Review> {
  const newReview = await prisma.review.create({
    data: {
      showId,
      userId: review.userId,
      author: review.author,
      title: review.title ?? null,
      text: review.text,
      rating: review.rating,
      date: new Date(review.date),
    },
  });

  return newReview as unknown as Review;
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
