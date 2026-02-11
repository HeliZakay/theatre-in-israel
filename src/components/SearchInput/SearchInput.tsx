"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buildShowsQueryString } from "@/utils/showsQuery";
import { useDebounce } from "@/hooks/useDebounce";
import type { ShowFilters } from "@/types";

interface SearchInputProps {
  defaultValue?: string;
  filters: ShowFilters;
  className?: string;
}

export default function SearchInput({
  defaultValue = "",
  filters,
  className,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const debouncedValue = useDebounce(value, 350);
  const router = useRouter();
  const pathname = usePathname();
  const lastPushed = useRef(defaultValue);

  // Sync input when the URL query changes externally (clear, back/forward).
  useEffect(() => {
    if (defaultValue !== lastPushed.current) {
      setValue(defaultValue);
      lastPushed.current = defaultValue;
    }
  }, [defaultValue]);

  // Navigate when the debounced search value changes.
  useEffect(() => {
    const trimmed = debouncedValue.trim();
    if (trimmed === (defaultValue ?? "")) return;

    lastPushed.current = trimmed;
    router.push(
      `${pathname}${buildShowsQueryString({
        query: trimmed,
        theatre: filters.theatre,
        genres: filters.genres,
        sort: filters.sort,
      })}`,
    );
  }, [debouncedValue, defaultValue, filters, pathname, router]);

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
