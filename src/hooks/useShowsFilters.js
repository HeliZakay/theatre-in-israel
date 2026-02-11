import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buildShowsQueryString } from "../utils/showsQuery";
import { useDebounce } from "./useDebounce";

const FILTER_KEYS = new Set(["query", "theatre", "genres", "sort"]);

const getSelectValue = (valueOrEvent) =>
  typeof valueOrEvent === "string" ? valueOrEvent : valueOrEvent?.target?.value ?? "";

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
  const initialQuery = query ?? "";
  const [searchValue, setSearchValue] = useState(initialQuery);
  const lastSubmittedQueryRef = useRef(initialQuery);

  useEffect(() => {
    const nextQueryFromUrl = query ?? "";

    // Ignore query updates triggered by this hook's debounced push,
    // so delayed router updates don't clobber in-progress typing.
    if (nextQueryFromUrl === lastSubmittedQueryRef.current) return;

    let active = true;

    // Defer state sync to satisfy strict effect linting while keeping
    // input state aligned with URL query changes.
    Promise.resolve().then(() => {
      if (!active) return;
      setSearchValue((current) =>
        current === nextQueryFromUrl ? current : nextQueryFromUrl,
      );
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
      const shouldResetPage = Object.keys(overrides).some((key) =>
        FILTER_KEYS.has(key),
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

  const pushQuery = useCallback(
    (overrides = {}) => {
      router.push(`${pathname}${buildQueryString(overrides)}`);
    },
    [router, pathname, buildQueryString],
  );

  const handleSelectChange = (key) => (valueOrEvent) => {
    const value = getSelectValue(valueOrEvent);
    pushQuery({ [key]: value });
  };

  const debouncedSearch = useDebounce(searchValue, 350);

  useEffect(() => {
    const nextQuery = debouncedSearch.trim();
    if (nextQuery === (query ?? "")) return;

    lastSubmittedQueryRef.current = nextQuery;
    pushQuery({ query: nextQuery });
  }, [debouncedSearch, query, pushQuery]);

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
