import prisma from "./prisma";
import { getAverageRating, getLatestReviewDate } from "../utils/showStats";

/**
 * Normalize a Prisma show (with genres relation) into the flat shape
 * that components expect: `genre: string[]` instead of
 * `genres: ShowGenre[]`.
 */
function normalizeShow(show) {
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
  reviews: { orderBy: { date: "desc" } },
};

/**
 * Fetch all shows from the database.
 * Returns normalized show objects matching the original JSON shape.
 */
export async function getShows() {
  const shows = await prisma.show.findMany({
    include: showInclude,
  });
  return shows.map(normalizeShow);
}

/**
 * Add a review to the specified show.
 * Returns `{ show, review }` or `null` if the show doesn't exist.
 */
export async function addReview(showId, review) {
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

  return { show: normalizeShow(updatedShow), review: newReview };
}

export { getAverageRating, getLatestReviewDate };
