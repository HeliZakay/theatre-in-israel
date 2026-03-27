// tests/component/useInfiniteShows.test.tsx

import { renderHook, act, waitFor } from "@testing-library/react";
import { useInfiniteShows } from "@/hooks/useInfiniteShows";
import type { ShowListItem, ShowFilters } from "@/types";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

// Mock IntersectionObserver
let mockObserverCallback: IntersectionObserverCallback;
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

beforeEach(() => {
  (global as Record<string, unknown>).IntersectionObserver = jest.fn(
    (callback: IntersectionObserverCallback) => {
      mockObserverCallback = callback;
      return { observe: mockObserve, disconnect: mockDisconnect, unobserve: mockUnobserve };
    },
  );
});

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock sessionStorage
const sessionStore: Record<string, string> = {};
const mockSessionStorage = {
  getItem: jest.fn((key: string) => sessionStore[key] ?? null),
  setItem: jest.fn((key: string, value: string) => {
    sessionStore[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete sessionStore[key];
  }),
};
Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage });

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock scrollRestoration
let scrollRestoration = "auto";
Object.defineProperty(window.history, "scrollRestoration", {
  get: () => scrollRestoration,
  set: (v: string) => {
    scrollRestoration = v;
  },
  configurable: true,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb: FrameRequestCallback) => {
  cb(0);
  return 0;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function makeShow(id: number): ShowListItem {
  return {
    id,
    slug: `show-${id}`,
    title: `Show ${id}`,
    theatre: "תיאטרון",
    durationMinutes: 90,
    summary: "סיכום",
    description: null,
    genre: [],
    reviewCount: 0,
    avgRating: null,
  };
}

const defaultFilters: ShowFilters = {
  theatre: "",
  query: "",
  genres: [],
  sort: "rating",
  page: 1,
};

function defaultOptions() {
  return {
    initialShows: [makeShow(1), makeShow(2)],
    initialHasMore: true,
    filters: defaultFilters,
  };
}

function fetchResponse(shows: ShowListItem[], hasMore: boolean) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ shows, hasMore }),
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  mockFetch.mockReset();
  mockObserve.mockClear();
  mockUnobserve.mockClear();
  mockDisconnect.mockClear();
  mockSessionStorage.getItem.mockClear();
  mockSessionStorage.setItem.mockClear();
  mockSessionStorage.removeItem.mockClear();
  Object.keys(sessionStore).forEach((k) => delete sessionStore[k]);
});

afterEach(() => {
  jest.useRealTimers();
});

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("useInfiniteShows", () => {
  describe("initialization", () => {
    it("uses initialShows when no session cache", () => {
      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));

      expect(result.current.shows).toHaveLength(2);
      expect(result.current.shows[0].id).toBe(1);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("restores from sessionStorage when filterKey matches", () => {
      const cached = {
        shows: [makeShow(1), makeShow(2), makeShow(3)],
        page: 3,
        hasMore: false,
        filterKey: JSON.stringify({
          theatre: "",
          query: "",
          genres: [],
          sort: "rating",
        }),
        scrollY: 500,
      };
      sessionStore["shows-infinite-scroll"] = JSON.stringify(cached);

      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));

      expect(result.current.shows).toHaveLength(3);
      expect(result.current.hasMore).toBe(false);
    });

    it("ignores sessionStorage when filterKey does not match", () => {
      const cached = {
        shows: [makeShow(10)],
        page: 5,
        hasMore: false,
        filterKey: JSON.stringify({
          theatre: "other",
          query: "",
          genres: [],
          sort: "rating",
        }),
        scrollY: 0,
      };
      sessionStore["shows-infinite-scroll"] = JSON.stringify(cached);

      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));

      // Falls back to initialShows
      expect(result.current.shows).toHaveLength(2);
      expect(result.current.shows[0].id).toBe(1);
    });

    it("handles sessionStorage errors gracefully", () => {
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error("storage disabled");
      });

      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));
      expect(result.current.shows).toHaveLength(2);
    });
  });

  describe("filter change", () => {
    it("resets state when filters change", () => {
      const opts = defaultOptions();
      const { result, rerender } = renderHook(
        (props) => useInfiniteShows(props),
        { initialProps: opts },
      );

      expect(result.current.shows).toHaveLength(2);

      const newShows = [makeShow(10)];
      rerender({
        initialShows: newShows,
        initialHasMore: false,
        filters: { ...defaultFilters, theatre: "קאמרי" },
      });

      expect(result.current.shows).toHaveLength(1);
      expect(result.current.shows[0].id).toBe(10);
      expect(result.current.hasMore).toBe(false);
    });

    it("clears session on filter change", () => {
      const opts = defaultOptions();
      const { rerender } = renderHook(
        (props) => useInfiniteShows(props),
        { initialProps: opts },
      );

      rerender({
        ...opts,
        filters: { ...defaultFilters, sort: "reviews" },
      });

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        "shows-infinite-scroll",
      );
    });
  });

  describe("loadMore", () => {
    it("fetches /api/shows with correct query params", async () => {
      const newShows = [makeShow(3)];
      mockFetch.mockResolvedValue(fetchResponse(newShows, true));

      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));

      await act(async () => {
        await result.current.sentinelRef(document.createElement("div"));
        // Trigger intersection
        mockObserverCallback(
          [{ isIntersecting: true }] as IntersectionObserverEntry[],
          {} as IntersectionObserver,
        );
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/shows"),
          expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
      });
    });

    it("deduplicates by id", async () => {
      // Return a show that already exists in initialShows
      const dupeShows = [makeShow(1), makeShow(3)];
      mockFetch.mockResolvedValue(fetchResponse(dupeShows, false));

      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));

      await act(async () => {
        result.current.sentinelRef(document.createElement("div"));
        mockObserverCallback(
          [{ isIntersecting: true }] as IntersectionObserverEntry[],
          {} as IntersectionObserver,
        );
      });

      await waitFor(() => {
        // show-1 is duplicate, only show-3 should be appended
        expect(result.current.shows).toHaveLength(3);
        expect(result.current.shows.map((s) => s.id)).toEqual([1, 2, 3]);
      });
    });

    it("increments page and updates hasMore", async () => {
      mockFetch.mockResolvedValue(fetchResponse([makeShow(3)], false));

      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));

      await act(async () => {
        result.current.sentinelRef(document.createElement("div"));
        mockObserverCallback(
          [{ isIntersecting: true }] as IntersectionObserverEntry[],
          {} as IntersectionObserver,
        );
      });

      await waitFor(() => {
        expect(result.current.hasMore).toBe(false);
      });
    });

    it("sets error on non-ok response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));

      await act(async () => {
        result.current.sentinelRef(document.createElement("div"));
        mockObserverCallback(
          [{ isIntersecting: true }] as IntersectionObserverEntry[],
          {} as IntersectionObserver,
        );
      });

      await waitFor(() => {
        expect(result.current.error).toContain("500");
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("ignores AbortError", async () => {
      const abortError = new DOMException("aborted", "AbortError");
      mockFetch.mockRejectedValue(abortError);

      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));

      await act(async () => {
        result.current.sentinelRef(document.createElement("div"));
        mockObserverCallback(
          [{ isIntersecting: true }] as IntersectionObserverEntry[],
          {} as IntersectionObserver,
        );
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should NOT set error for AbortError
      expect(result.current.error).toBeNull();
    });

    it("prevents concurrent loadMore calls (stale closure race)", async () => {
      let resolveFirst!: (v: unknown) => void;
      const firstFetch = new Promise((resolve) => {
        resolveFirst = resolve;
      });
      mockFetch.mockReturnValueOnce(firstFetch);

      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));

      act(() => {
        result.current.sentinelRef(document.createElement("div"));
      });

      // Fire observer twice rapidly — simulates the stale closure race
      await act(async () => {
        mockObserverCallback(
          [{ isIntersecting: true }] as IntersectionObserverEntry[],
          {} as IntersectionObserver,
        );
        mockObserverCallback(
          [{ isIntersecting: true }] as IntersectionObserverEntry[],
          {} as IntersectionObserver,
        );
      });

      // Only one fetch should have been made
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Resolve and verify normal completion
      await act(async () => {
        resolveFirst(fetchResponse([makeShow(3)], true));
      });

      await waitFor(() => {
        expect(result.current.shows).toHaveLength(3);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("does nothing when hasMore is false", async () => {
      const opts = { ...defaultOptions(), initialHasMore: false };
      const { result } = renderHook(() => useInfiniteShows(opts));

      await act(async () => {
        result.current.sentinelRef(document.createElement("div"));
        mockObserverCallback(
          [{ isIntersecting: true }] as IntersectionObserverEntry[],
          {} as IntersectionObserver,
        );
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("re-evaluates observer after successful load with hasMore", async () => {
      mockFetch.mockResolvedValue(fetchResponse([makeShow(3)], true));

      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));

      const sentinel = document.createElement("div");
      act(() => {
        result.current.sentinelRef(sentinel);
      });

      // Initial observe
      expect(mockObserve).toHaveBeenCalledTimes(1);
      mockObserve.mockClear();
      mockUnobserve.mockClear();

      await act(async () => {
        mockObserverCallback(
          [{ isIntersecting: true }] as IntersectionObserverEntry[],
          {} as IntersectionObserver,
        );
      });

      await waitFor(() => {
        expect(result.current.shows).toHaveLength(3);
      });

      // Flush the requestAnimationFrame that re-evaluates the observer
      act(() => {
        jest.runAllTimers();
      });

      // After successful load, observer should unobserve+observe to
      // force re-evaluation in case sentinel stayed within rootMargin
      expect(mockUnobserve).toHaveBeenCalled();
      expect(mockObserve).toHaveBeenCalled();
    });

    it("sets announcement with count of new shows", async () => {
      mockFetch.mockResolvedValue(
        fetchResponse([makeShow(3), makeShow(4)], true),
      );

      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));

      await act(async () => {
        result.current.sentinelRef(document.createElement("div"));
        mockObserverCallback(
          [{ isIntersecting: true }] as IntersectionObserverEntry[],
          {} as IntersectionObserver,
        );
      });

      await waitFor(() => {
        expect(result.current.announcement).toContain("2");
      });
    });
  });

  describe("retry", () => {
    it("clears error state", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));

      await act(async () => {
        result.current.sentinelRef(document.createElement("div"));
        mockObserverCallback(
          [{ isIntersecting: true }] as IntersectionObserverEntry[],
          {} as IntersectionObserver,
        );
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      act(() => {
        result.current.retry();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("sentinelRef / IntersectionObserver", () => {
    it("creates observer with 400px rootMargin", () => {
      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));

      act(() => {
        result.current.sentinelRef(document.createElement("div"));
      });

      expect(IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
        rootMargin: "0px 0px 400px 0px",
      });
      expect(mockObserve).toHaveBeenCalled();
    });

    it("disconnects previous observer when sentinel changes", () => {
      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));

      act(() => {
        result.current.sentinelRef(document.createElement("div"));
      });

      act(() => {
        result.current.sentinelRef(document.createElement("div"));
      });

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it("disconnects on null node", () => {
      const { result } = renderHook(() => useInfiniteShows(defaultOptions()));

      act(() => {
        result.current.sentinelRef(document.createElement("div"));
      });

      act(() => {
        result.current.sentinelRef(null);
      });

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("disconnects observer on unmount", () => {
      const { result, unmount } = renderHook(() =>
        useInfiniteShows(defaultOptions()),
      );

      act(() => {
        result.current.sentinelRef(document.createElement("div"));
      });

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});
