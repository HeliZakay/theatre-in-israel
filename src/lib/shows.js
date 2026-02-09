import fs from "fs/promises";
import path from "path";
import { getAverageRating, getLatestReviewDate } from "../utils/showStats";

const dataPath = path.join(process.cwd(), "src", "data", "shows.json");

// Simple in-memory cache to avoid re-reading file on every request.
// Cache is invalidated/updated on writes.
let cachedShows = null;

export async function getShows() {
  if (cachedShows) return cachedShows;

  const file = await fs.readFile(dataPath, "utf8");
  cachedShows = JSON.parse(file);
  return cachedShows;
}

async function writeAtomic(filePath, data) {
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, data, "utf8");
  await fs.rename(tmpPath, filePath);
}

export async function addReview(showId, review) {
  const shows = await getShows();
  const show = shows.find((item) => String(item.id) === String(showId));

  if (!show) {
    return null;
  }

  const nextId =
    show.reviews.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const newReview = {
    id: nextId,
    ...review,
  };

  show.reviews.push(newReview);

  // Update disk atomically and update cache reference so future reads are fast
  await writeAtomic(dataPath, JSON.stringify(shows, null, 2));
  cachedShows = shows;

  return { show, review: newReview };
}

export { getAverageRating, getLatestReviewDate };
