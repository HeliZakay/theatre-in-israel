"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildShowsQueryString } from "@/utils/showsQuery";
import type { ShowListItem, ShowFilters } from "@/types";

interface UseInfiniteShowsOptions {
  initialShows: ShowListItem[];
  initialHasMore: boolean;
  filters: ShowFilters;
}

interface UseInfiniteShowsReturn {
  shows: ShowListItem[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  retry: () => void;
  sentinelRef: (node: HTMLDivElement | null) => void;
  announcement: string;
}

const STORAGE_KEY = "shows-infinite-scroll";

function serializeFilterKey(filters: ShowFilters): string {
  return JSON.stringify({
    theatre: filters.theatre,
    query: filters.query,
    genres: [...filters.genres].sort(),
    sort: filters.sort,
  });
}

function saveToSession(data: {
  shows: ShowListItem[];
  page: number;
  hasMore: boolean;
  filterKey: string;
  scrollY: number;
}) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or disabled — ignore
  }
}

function loadFromSession(): {
  shows: ShowListItem[];
  page: number;
  hasMore: boolean;
  filterKey: string;
  scrollY: number;
} | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function useInfiniteShows({
  initialShows,
  initialHasMore,
  filters,
}: UseInfiniteShowsOptions): UseInfiniteShowsReturn {
  const filterKey = serializeFilterKey(filters);
  const filterKeyRef = useRef(filterKey);

  // Try to restore from session on first render
  const [restoredState] = useState(() => {
    if (typeof window === "undefined") return null;
    const cached = loadFromSession();
    if (cached && cached.filterKey === filterKey) return cached;
    return null;
  });

  const [shows, setShows] = useState<ShowListItem[]>(
    restoredState?.shows ?? initialShows,
  );
  const [page, setPage] = useState(restoredState?.page ?? 2);
  const [hasMore, setHasMore] = useState(
    restoredState?.hasMore ?? initialHasMore,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const seenIdsRef = useRef<Set<number>>(
    new Set((restoredState?.shows ?? initialShows).map((s) => s.id)),
  );
  const abortRef = useRef<AbortController | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelNodeRef = useRef<HTMLDivElement | null>(null);

  // Restore scroll position from session
  useEffect(() => {
    if (restoredState?.scrollY) {
      requestAnimationFrame(() => {
        window.scrollTo(0, restoredState.scrollY);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual scroll restoration
  useEffect(() => {
    const original = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = original;
    };
  }, []);

  // Reset on filter change
  useEffect(() => {
    if (filterKey === filterKeyRef.current) return;
    filterKeyRef.current = filterKey;

    abortRef.current?.abort();
    abortRef.current = null;

    setShows(initialShows);
    setPage(2);
    setHasMore(initialHasMore);
    setIsLoading(false);
    setError(null);
    setAnnouncement("");

    seenIdsRef.current = new Set(initialShows.map((s) => s.id));
    clearSession();
  }, [filterKey, initialShows, initialHasMore]);

  // Also reset when initialShows changes for the same filter key
  // (e.g., server re-render with updated data)
  const initialShowsKeyRef = useRef(initialShows.map((s) => s.id).join(","));
  useEffect(() => {
    const newKey = initialShows.map((s) => s.id).join(",");
    if (newKey === initialShowsKeyRef.current) return;
    initialShowsKeyRef.current = newKey;

    if (filterKey !== filterKeyRef.current) return; // already handled above

    setShows(initialShows);
    setPage(2);
    setHasMore(initialHasMore);
    setError(null);
    seenIdsRef.current = new Set(initialShows.map((s) => s.id));
    clearSession();
  }, [initialShows, initialHasMore, filterKey]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || error) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const qs = buildShowsQueryString({
        theatre: filters.theatre || undefined,
        query: filters.query || undefined,
        genres: filters.genres,
        sort: filters.sort,
        page,
      });

      const res = await fetch(`/api/shows${qs}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`שגיאה בטעינת הצגות (${res.status})`);
      }

      const data: { shows: ShowListItem[]; hasMore: boolean } =
        await res.json();

      // Deduplicate
      const newShows = data.shows.filter((s) => !seenIdsRef.current.has(s.id));
      for (const s of newShows) {
        seenIdsRef.current.add(s.id);
      }

      setShows((prev) => {
        const updated = [...prev, ...newShows];
        // Save to session after update
        const currentFilterKey = filterKeyRef.current;
        requestAnimationFrame(() => {
          saveToSession({
            shows: updated,
            page: page + 1,
            hasMore: data.hasMore,
            filterKey: currentFilterKey,
            scrollY: window.scrollY,
          });
        });
        return updated;
      });
      setPage((p) => p + 1);
      setHasMore(data.hasMore);

      if (newShows.length > 0) {
        setAnnouncement(`נטענו ${newShows.length} הצגות נוספות`);
        setTimeout(() => setAnnouncement(""), 1000);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(
        err instanceof Error ? err.message : "שגיאה בטעינת הצגות נוספות",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, error, filters, page]);

  // Retry clears error and retriggers loadMore
  const retry = useCallback(() => {
    setError(null);
    // loadMore will be triggered by the observer on next tick
  }, []);

  // IntersectionObserver via ref callback
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      sentinelNodeRef.current = node;
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            loadMore();
          }
        },
        { rootMargin: "0px 0px 400px 0px" },
      );

      observerRef.current.observe(node);
    },
    [loadMore],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      observerRef.current?.disconnect();
    };
  }, []);

  return { shows, isLoading, hasMore, error, retry, sentinelRef, announcement };
}
