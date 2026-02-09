import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buildShowsQueryString } from "../utils/showsQuery";
import { useDebounce } from "./useDebounce";

export function useShowsFilters({
  query,
  theatreFilter,
  genreFilters,
  selectedSort,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(query ?? "");

  useEffect(() => {
    setSearchValue(query ?? "");
  }, [query]);

  const buildQueryString = useCallback(
    (overrides = {}) => {
      const nextQuery = overrides.query ?? query;
      const nextTheatre = overrides.theatre ?? theatreFilter;
      const nextGenres = overrides.genres ?? genreFilters;
      const nextSort = overrides.sort ?? selectedSort;

      return buildShowsQueryString({
        query: nextQuery,
        theatre: nextTheatre,
        genres: nextGenres,
        sort: nextSort,
        defaultSort: "rating",
      });
    },
    [query, theatreFilter, genreFilters, selectedSort],
  );

  const handleSelectChange = (key) => (event) => {
    const value = event.target.value;
    router.push(`${pathname}${buildQueryString({ [key]: value })}`);
  };

  const debouncedSearch = useDebounce(searchValue, 350);

  useEffect(() => {
    const nextQuery = debouncedSearch.trim();
    if (nextQuery === (query ?? "")) return;
    router.push(`${pathname}${buildQueryString({ query: nextQuery })}`);
  }, [debouncedSearch, query, pathname, router, buildQueryString]);

  const toggleGenre = (genre) => {
    const current = new Set(genreFilters);
    if (current.has(genre)) {
      current.delete(genre);
    } else {
      current.add(genre);
    }
    return Array.from(current);
  };

  const getToggledGenres = (genre) => {
    const current = new Set(genreFilters);
    if (current.has(genre)) {
      current.delete(genre);
    } else {
      current.add(genre);
    }
    return Array.from(current);
  };

  return {
    buildQueryString,
    handleSelectChange,
    pathname,
    searchValue,
    setSearchValue,
    getToggledGenres,
  };
}
