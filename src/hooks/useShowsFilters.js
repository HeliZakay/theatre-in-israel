import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buildShowsQueryString } from "../utils/showsQuery";
import { useDebounce } from "./useDebounce";

// useShowsFilters manages UI state for the shows list page and exposes
// helpers to build query strings and navigate when filters change.
// It keeps a debounced search input locally to avoid pushing every
// keystroke into the router.

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
    let active = true;
    const next = query ?? "";
    // Defer state sync to satisfy strict effect linting while keeping
    // input state aligned with URL query changes.
    Promise.resolve().then(() => {
      if (!active) return;
      setSearchValue((current) => (current === next ? current : next));
    });

    return () => {
      active = false;
    };
  }, [query]);

  const buildQueryString = useCallback(
    (overrides = {}) => {
      const nextQuery = overrides.query ?? query;
      const nextTheatre = overrides.theatre ?? theatreFilter;
      const nextGenres = overrides.genres ?? genreFilters;
      const nextSort = overrides.sort ?? selectedSort;

      // If any filter (query/theatre/genres/sort) changed, reset to page 1
      const filterKeys = ["query", "theatre", "genres", "sort"];
      const shouldResetPage = Object.keys(overrides).some((k) =>
        filterKeys.includes(k),
      );

      return buildShowsQueryString({
        query: nextQuery,
        theatre: nextTheatre,
        genres: nextGenres,
        sort: nextSort,
        page: overrides.page ?? (shouldResetPage ? 1 : undefined),
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

  // Return a new array with the given genre toggled. This function
  // does not perform navigation — it only returns the next genres
  // array so callers can decide when/how to update the URL/router.
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
