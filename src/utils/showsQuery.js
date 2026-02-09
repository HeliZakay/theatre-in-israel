export const DEFAULT_SORT = "rating";

export function buildShowsQueryString({
  query,
  theatre,
  genres,
  sort,
  page,
  defaultSort = DEFAULT_SORT,
} = {}) {
  const params = new URLSearchParams();

  if (query) params.set("query", query);
  if (theatre) params.set("theatre", theatre);
  if (genres?.length) {
    genres.forEach((genre) => {
      if (genre) {
        params.append("genre", genre);
      }
    });
  }
  if (sort && sort !== defaultSort) params.set("sort", sort);
  if (page && Number(page) > 1) params.set("page", String(page));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export function parseShowsSearchParams(searchParams, defaultSort = DEFAULT_SORT) {
  const { theatre, query, genre, sort } = searchParams ?? {};
  const genreFilters = Array.isArray(genre) ? genre : genre ? [genre] : [];

  // Parse page parameter (1-based). Default to 1 when missing or invalid.
  const rawPage = searchParams?.page;
  const page = rawPage ? Math.max(1, parseInt(rawPage, 10) || 1) : 1;

  return {
    theatreFilter: theatre ?? "",
    query: query ?? "",
    genreFilters,
    selectedSort: sort ?? defaultSort,
    page,
  };
}
