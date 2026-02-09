import fs from "fs/promises";
import path from "path";
import { getAverageRating, getLatestReviewDate } from "../utils/showStats";

// This module provides simple file-backed data access for development.
// It reads from `src/data/shows.json` and exposes helpers used by
// server components and the API route. For small datasets we keep a
// lightweight in-memory cache to avoid repeated file reads during a
// single process lifetime.
const dataPath = path.join(process.cwd(), "src", "data", "shows.json");

// Simple in-memory cache to avoid re-reading file on every request.
// Cache is invalidated/updated on writes.
let cachedShows = null;

export async function getShows() {
  // Return cached value when available to reduce I/O.
  if (cachedShows) return cachedShows;

  // Otherwise read from disk and cache the parsed result.
  const file = await fs.readFile(dataPath, "utf8");
  cachedShows = JSON.parse(file);
  return cachedShows;
}

async function writeAtomic(filePath, data) {
  // Perform an atomic update by writing to a temporary file and
  // renaming it into place. This minimizes the chance of leaving
  // a partially-written file if the process crashes mid-write.
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, data, "utf8");
  await fs.rename(tmpPath, filePath);
}

export async function addReview(showId, review) {
  // Add a review to the specified show and persist the full dataset.
  // Note: This approach reads and writes the entire JSON file, which
  // is acceptable for small/local datasets but will not scale for high
  // concurrency or large datasets.
  const shows = await getShows();
  const show = shows.find((item) => String(item.id) === String(showId));

  if (!show) {
    return null;
  }

  // Compute next numeric ID based on existing reviews.
  const nextId =
    show.reviews.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const newReview = {
    id: nextId,
    ...review,
  };

  show.reviews.push(newReview);

  // Persist the updated array atomically and refresh the cache.
  await writeAtomic(dataPath, JSON.stringify(shows, null, 2));
  cachedShows = shows;

  return { show, review: newReview };
}

export { getAverageRating, getLatestReviewDate };
