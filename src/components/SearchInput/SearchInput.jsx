"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buildShowsQueryString } from "@/utils/showsQuery";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * A self-contained search input that debounces keystrokes and pushes
 * the trimmed value into the URL query string.  It owns its own local
 * state so the rest of the filter bar doesn't need to manage it.
 */
export default function SearchInput({ defaultValue = "", filters, className }) {
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
