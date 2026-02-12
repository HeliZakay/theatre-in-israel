"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buildShowsQueryString } from "@/utils/showsQuery";
import { useDebounce } from "@/hooks/useDebounce";
import type { ShowFilters } from "@/types";

interface SearchInputProps {
  defaultValue?: string;
  filters: ShowFilters;
  className?: string;
  onPendingChange?: (pending: boolean) => void;
}

export default function SearchInput({
  defaultValue = "",
  filters,
  className,
  onPendingChange,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const debouncedValue = useDebounce(value, 350);
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Keep filters in a ref so changes don't re-trigger the navigation effect.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Track the last value we actually navigated to, so we never compare
  // against a potentially stale `defaultValue` prop from the server.
  const lastPushedRef = useRef(defaultValue);

  // If defaultValue changes externally (e.g. "clear filters" link) while the
  // user is NOT typing, sync the input so it doesn't show a stale query.
  useEffect(() => {
    setValue((prev) => {
      // Only sync when the local value still matches the last thing we
      // pushed — meaning the user hasn't started a new search in between.
      if (prev.trim() === lastPushedRef.current) {
        lastPushedRef.current = defaultValue.trim();
        return defaultValue;
      }
      return prev;
    });
  }, [defaultValue]);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  // Navigate when the debounced search value changes.
  useEffect(() => {
    const trimmed = debouncedValue.trim();
    if (trimmed === lastPushedRef.current) return;
    lastPushedRef.current = trimmed;

    const f = filtersRef.current;
    const href = `${pathname}${buildShowsQueryString({
      query: trimmed,
      theatre: f.theatre,
      genres: f.genres,
      sort: f.sort,
    })}`;
    startTransition(() => {
      router.push(href);
    });
  }, [debouncedValue, pathname, router, startTransition]);

  return (
    <input
      id="query"
      name="query"
      className={className}
      type="search"
      placeholder="חפש.י הצגה, תיאטרון או ז'אנר"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
