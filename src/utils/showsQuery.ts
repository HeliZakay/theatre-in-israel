import { DEFAULT_SORT } from "@/constants/sorts";

interface BuildShowsQueryStringParams {
  query?: string;
  theatre?: string;
  genres?: string[];
  sort?: string;
  page?: number;
}

export function buildShowsQueryString({
  query,
  theatre,
  genres,
  sort,
  page,
}: BuildShowsQueryStringParams = {}): string {
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
  // Only include `sort` in the URL when it differs from the canonical default.
  if (sort && sort !== DEFAULT_SORT) params.set("sort", sort);
  if (page && Number(page) > 1) params.set("page", String(page));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export function parseShowsSearchParams(
  searchParams?: Record<string, string | string[] | undefined>,
): {
  theatre: string;
  query: string;
  genres: string[];
  sort: string;
  page: number;
} {
  const { theatre, query, genre, sort } = searchParams ?? {};
  const genres = Array.isArray(genre) ? genre : genre ? [genre] : [];

  // Parse page parameter (1-based). Default to 1 when missing or invalid.
  const rawPage = searchParams?.page;
  const page = rawPage ? Math.max(1, parseInt(String(rawPage), 10) || 1) : 1;

  return {
    theatre: (Array.isArray(theatre) ? theatre[0] : theatre) ?? "",
    query: (Array.isArray(query) ? query[0] : query) ?? "",
    genres,
    sort: (Array.isArray(sort) ? sort[0] : sort) ?? DEFAULT_SORT,
    page,
  };
}
