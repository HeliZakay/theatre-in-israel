/**
 * Infinite-scroll hook for the shows list page.
 *
 * Key design decisions:
 * - **Session storage**: Scroll position and loaded pages are persisted to
 *   sessionStorage so users can navigate to a show detail page and press
 *   back without losing their place.
 * - **IntersectionObserver**: A sentinel div near the bottom of the list
 *   triggers the next page fetch when it enters the viewport.
 * - **isLoadingRef**: A ref mirrors the `isLoading` state because the
 *   IntersectionObserver callback captures a stale closure — the ref is
 *   the source of truth for "is a fetch in flight".
 */
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
  const isLoadingRef = useRef(false);
  const pageRef = useRef(restoredState?.page ?? 2);

  // Restore scroll position from session.
  // Double-rAF ensures the browser has completed layout after the first paint.
  useEffect(() => {
    if (restoredState?.scrollY) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(0, restoredState.scrollY);
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    pageRef.current = 2;
    isLoadingRef.current = false;
    clearSession();
  }, [filterKey, initialShows, initialHasMore]);

  // Second reset effect: handles the case where the server re-renders the page
  // with different initial data but the same filter key (e.g., a show was added).
  // The first effect above only fires on filter key changes.
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
    pageRef.current = 2;
    clearSession();
  }, [initialShows, initialHasMore, filterKey]);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore || error) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const currentPage = pageRef.current;

    try {
      const qs = buildShowsQueryString({
        theatre: filters.theatre || undefined,
        query: filters.query || undefined,
        genres: filters.genres,
        sort: filters.sort,
        page: currentPage,
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
        // Defer sessionStorage write to after React commits the DOM update,
        // so window.scrollY reflects the actual post-render scroll position.
        const currentFilterKey = filterKeyRef.current;
        requestAnimationFrame(() => {
          saveToSession({
            shows: updated,
            page: currentPage + 1,
            hasMore: data.hasMore,
            filterKey: currentFilterKey,
            scrollY: window.scrollY,
          });
        });
        return updated;
      });
      pageRef.current = currentPage + 1;
      setPage(currentPage + 1);
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
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [hasMore, error, filters]);

  // Retry clears error and retriggers loadMore
  const retry = useCallback(() => {
    setError(null);
    // loadMore will be triggered by the observer on next tick
  }, []);

  // Callback ref: when React mounts/unmounts the sentinel div, this creates
  // or destroys the IntersectionObserver. Using a callback ref (instead of
  // useEffect + useRef) ensures the observer is always in sync with the DOM.
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

  // Keep refs in sync for the save-on-unmount closure
  const showsRef = useRef(shows);
  const hasMoreRef = useRef(hasMore);
  useEffect(() => {
    showsRef.current = shows;
  }, [shows]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // Save scroll position on navigation away + cleanup on unmount
  useEffect(() => {
    const saveScroll = () => {
      saveToSession({
        shows: showsRef.current,
        page: pageRef.current,
        hasMore: hasMoreRef.current,
        filterKey: filterKeyRef.current,
        scrollY: window.scrollY,
      });
    };

    window.addEventListener("beforeunload", saveScroll);
    return () => {
      window.removeEventListener("beforeunload", saveScroll);
      // Also save when component unmounts (SPA navigation)
      saveScroll();
      abortRef.current?.abort();
      observerRef.current?.disconnect();
    };
  }, []);

  return { shows, isLoading, hasMore, error, retry, sentinelRef, announcement };
}
