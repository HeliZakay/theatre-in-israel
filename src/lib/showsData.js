import { getShows } from "./shows";
import { normalize } from "../utils/normalize";
import { parseShowsSearchParams } from "../utils/showsQuery";
import { enrichShow } from "../utils/showStats";

/**
 * Build a list of unique suggestions from shows (titles, theatres, genres).
 * @param {Array} shows - Array of show objects
 * @returns {Array} Array of unique suggestion strings
 */
function buildSuggestions(shows) {
  return Array.from(
    new Set([
      ...shows.map((show) => show.title),
      ...shows.map((show) => show.theatre),
      ...shows.flatMap((show) => show.genre ?? []),
    ]),
  ).filter(Boolean);
}

/**
 * Normalize filter values for consistent searching.
 * @param {Object} filters
 * @param {string} filters.theatreFilter
 * @param {string} filters.query
 * @param {Array} filters.genreFilters
 * @returns {Object} Normalized filter values
 */
function normalizeFilters({ theatreFilter, query, genreFilters }) {
  return {
    theatreNormalized: normalize(theatreFilter),
    queryNormalized: normalize(query),
    genreNormalized: genreFilters.map(normalize).filter(Boolean),
  };
}

/**
 * Filter shows by normalized theatre, query, and genre.
 * @param {Array} shows - Array of show objects
 * @param {Object} normalized - Normalized filter values
 * @returns {Array} Filtered shows
 */
function filterShows(
  shows,
  { theatreNormalized, queryNormalized, genreNormalized },
) {
  return shows.filter((show) => {
    const matchesTheatre = theatreNormalized
      ? normalize(show.theatre) === theatreNormalized
      : true;

    const matchesQuery = queryNormalized
      ? [show.title, show.theatre, (show.genre ?? []).join(" ")]
          .filter(Boolean)
          .some((field) => normalize(field).includes(queryNormalized))
      : true;

    const matchesGenre = genreNormalized.length
      ? (show.genre ?? []).some((genre) =>
          genreNormalized.includes(normalize(genre)),
        )
      : true;

    return matchesTheatre && matchesQuery && matchesGenre;
  });
}

/**
 * Sort shows by average rating (desc or asc).
 * @param {Array} shows - Array of enriched show objects
 * @param {string} selectedSort - Sort order ("rating" or "rating-asc")
 * @returns {Array} Sorted shows
 */
function sortShowsByRating(shows, selectedSort) {
  if (selectedSort !== "rating" && selectedSort !== "rating-asc") {
    return shows;
  }

  return [...shows].sort((a, b) => {
    const ratingA = a.avgRating ?? -1;
    const ratingB = b.avgRating ?? -1;
    return selectedSort === "rating-asc"
      ? ratingA - ratingB
      : ratingB - ratingA;
  });
}

/**
 * Get homepage data: suggestions, top rated, and latest reviewed shows.
 * @returns {Promise<Object>} Homepage data
 */
export async function getHomePageData() {
  const shows = await getShows();
  const suggestions = buildSuggestions(shows);

  const enrichedShows = shows.map(enrichShow);
  const topRated = enrichedShows
    .filter((show) => show.avgRating !== null)
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 6);

  const latestReviewed = enrichedShows
    .filter((show) => show.latestReviewDate)
    .sort((a, b) => b.latestReviewDate - a.latestReviewDate)
    .slice(0, 6);

  return { suggestions, topRated, latestReviewed };
}

/**
 * Get shows for list page, filtered and sorted by search params.
 * @param {Object} searchParams - Query params from URL
 * @returns {Promise<Object>} List data (shows, filters, theatres, genres)
 */
export async function getShowsForList(searchParams) {
  const filters = parseShowsSearchParams(searchParams);
  const shows = (await getShows()).map(enrichShow);

  const theatres = Array.from(
    new Set(shows.map((show) => show.theatre)),
  ).filter(Boolean);
  const genres = Array.from(
    new Set(shows.flatMap((show) => show.genre ?? [])),
  ).filter(Boolean);

  const normalized = normalizeFilters(filters);
  const filteredShows = filterShows(shows, normalized);
  const sortedShows = sortShowsByRating(filteredShows, filters.selectedSort);

  // Pagination: determine page/perPage and slice results.
  const perPage = 12; // default items per page
  const page = filters.page ?? 1;
  const total = sortedShows.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const start = (clampedPage - 1) * perPage;
  const end = start + perPage;
  const paginated = sortedShows.slice(start, end);

  return {
    shows: paginated,
    theatres,
    genres,
    filters: { ...filters, page: clampedPage, perPage, total, totalPages },
  };
}

/**
 * Get a single show by its ID.
 * @param {string|number} showId - Show ID
 * @returns {Promise<Object|null>} Show object or null if not found
 */
export async function getShowById(showId) {
  const shows = await getShows();
  return shows.find((item) => String(item.id) === String(showId)) ?? null;
}
