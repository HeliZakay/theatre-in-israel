import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buildShowsQueryString } from "../utils/showsQuery";

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

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextQuery = searchValue.trim();
      if (nextQuery === (query ?? "")) {
        return;
      }
      router.push(`${pathname}${buildQueryString({ query: nextQuery })}`);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchValue, query, pathname, router, buildQueryString]);

  const toggleGenre = (genre) => {
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
    toggleGenre,
  };
}
