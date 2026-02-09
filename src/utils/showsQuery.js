export function buildShowsQueryString({
  query,
  theatre,
  genres,
  sort,
  defaultSort = "rating",
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

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export function parseShowsSearchParams(searchParams, defaultSort = "rating") {
  const { theatre, query, genre, sort } = searchParams ?? {};
  const genreFilters = Array.isArray(genre) ? genre : genre ? [genre] : [];

  return {
    theatreFilter: theatre ?? "",
    query: query ?? "",
    genreFilters,
    selectedSort: sort ?? defaultSort,
  };
}
