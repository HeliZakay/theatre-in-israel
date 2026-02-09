import fs from "fs/promises";
import path from "path";
import { getAverageRating, getLatestReviewDate } from "../utils/showStats";

const dataPath = path.join(process.cwd(), "src", "data", "shows.json");

export async function getShows() {
  const file = await fs.readFile(dataPath, "utf8");
  return JSON.parse(file);
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
  await fs.writeFile(dataPath, JSON.stringify(shows, null, 2));

  return { show, review: newReview };
}

export { getAverageRating, getLatestReviewDate };
