"use client";

import { useEffect, useState, useTransition } from "react";
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

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  // Navigate when the debounced search value changes.
  useEffect(() => {
    const trimmed = debouncedValue.trim();
    if (trimmed === (defaultValue ?? "")) return;

    const href = `${pathname}${buildShowsQueryString({
      query: trimmed,
      theatre: filters.theatre,
      genres: filters.genres,
      sort: filters.sort,
    })}`;
    startTransition(() => {
      router.push(href);
    });
  }, [debouncedValue, defaultValue, filters, pathname, router, startTransition]);

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
