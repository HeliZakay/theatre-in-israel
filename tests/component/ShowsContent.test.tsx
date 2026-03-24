import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShowsContent from "@/app/shows/ShowsContent";
import type { ShowFilters, ShowListItem } from "@/types";

// --- IntersectionObserver mock ---
type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let observerCallback: ObserverCallback | null = null;
let observerInstance: IntersectionObserver | null = null;

beforeEach(() => {
  observerCallback = null;
  observerInstance = null;

  global.IntersectionObserver = jest.fn((callback) => {
    observerCallback = callback as ObserverCallback;
    observerInstance = {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
      root: null,
      rootMargin: "",
      thresholds: [],
      takeRecords: jest.fn(() => []),
    };
    return observerInstance as unknown as IntersectionObserver;
  }) as unknown as typeof IntersectionObserver;

  // Mock sessionStorage
  const store: Record<string, string> = {};
  jest.spyOn(Storage.prototype, "getItem").mockImplementation((key) => store[key] ?? null);
  jest.spyOn(Storage.prototype, "setItem").mockImplementation((key, val) => { store[key] = val; });
  jest.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => { delete store[key]; });

  // Mock scroll restoration
  Object.defineProperty(window.history, "scrollRestoration", {
    writable: true,
    value: "auto",
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

function makeShow(id: number, title = `Show ${id}`): ShowListItem {
  return {
    id,
    slug: `show-${id}`,
    title,
    theatre: "Test Theatre",
    durationMinutes: 90,
    summary: "A great show",
    description: null,
    genre: ["drama"],
    reviewCount: 5,
    avgRating: 4.2,
  };
}

const baseFilters: ShowFilters = {
  theatre: "",
  query: "",
  genres: [],
  sort: "reviews",
  page: 1,
  perPage: 12,
  total: 30,
  totalPages: 3,
};

const initialShows = Array.from({ length: 12 }, (_, i) => makeShow(i + 1));

describe("ShowsContent", () => {
  it("renders initial shows from server", () => {
    render(
      <ShowsContent
        shows={initialShows}
        theatres={["Test Theatre"]}
        genres={["drama"]}
        availableGenres={["drama"]}
        filters={baseFilters}
        hasMore={true}
      />,
    );

    expect(screen.getByText("Show 1")).toBeInTheDocument();
    expect(screen.getByText("Show 12")).toBeInTheDocument();
  });

  it("shows progressive count when not all shows loaded", () => {
    render(
      <ShowsContent
        shows={initialShows}
        theatres={["Test Theatre"]}
        genres={["drama"]}
        availableGenres={["drama"]}
        filters={baseFilters}
        hasMore={true}
      />,
    );

    expect(screen.getByText("12 מתוך 30 הצגות")).toBeInTheDocument();
  });

  it("renders sentinel div when hasMore is true", () => {
    const { container } = render(
      <ShowsContent
        shows={initialShows}
        theatres={["Test Theatre"]}
        genres={["drama"]}
        availableGenres={["drama"]}
        filters={baseFilters}
        hasMore={true}
      />,
    );

    const sentinel = container.querySelector('[aria-hidden="true"]');
    expect(sentinel).toBeInTheDocument();
  });

  it("shows end-of-list message when hasMore is false", () => {
    render(
      <ShowsContent
        shows={initialShows}
        theatres={["Test Theatre"]}
        genres={["drama"]}
        availableGenres={["drama"]}
        filters={{ ...baseFilters, total: 12 }}
        hasMore={false}
      />,
    );

    expect(screen.getByText("הגעתם לסוף הרשימה")).toBeInTheDocument();
  });

  it("loads more shows when sentinel becomes visible", async () => {
    const nextPage = Array.from({ length: 12 }, (_, i) => makeShow(i + 13));
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shows: nextPage, hasMore: true }),
    });

    render(
      <ShowsContent
        shows={initialShows}
        theatres={["Test Theatre"]}
        genres={["drama"]}
        availableGenres={["drama"]}
        filters={baseFilters}
        hasMore={true}
      />,
    );

    // Trigger intersection observer
    await act(async () => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    await waitFor(() => {
      expect(screen.getByText("Show 13")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/shows"),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("shows error message and retry button on fetch failure", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(
      <ShowsContent
        shows={initialShows}
        theatres={["Test Theatre"]}
        genres={["drama"]}
        availableGenres={["drama"]}
        filters={baseFilters}
        hasMore={true}
      />,
    );

    await act(async () => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    await waitFor(() => {
      expect(screen.getByText(/שגיאה/)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "נסו שוב" })).toBeInTheDocument();
  });

  it("retries loading on retry button click", async () => {
    const user = userEvent.setup();

    // First call fails, second succeeds
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ shows: [makeShow(13)], hasMore: false }),
      });

    render(
      <ShowsContent
        shows={initialShows}
        theatres={["Test Theatre"]}
        genres={["drama"]}
        availableGenres={["drama"]}
        filters={baseFilters}
        hasMore={true}
      />,
    );

    // Trigger failure
    await act(async () => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    await waitFor(() => {
      expect(screen.getByText(/שגיאה/)).toBeInTheDocument();
    });

    // Click retry
    await user.click(screen.getByRole("button", { name: "נסו שוב" }));

    // Observer should re-trigger loadMore since error is cleared
    await act(async () => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    await waitFor(() => {
      expect(screen.getByText("Show 13")).toBeInTheDocument();
    });
  });

  it("does not render duplicate shows", async () => {
    // Return a show with ID 12 (already in initial list) plus a new one
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        shows: [makeShow(12, "Show 12 duplicate"), makeShow(13)],
        hasMore: false,
      }),
    });

    render(
      <ShowsContent
        shows={initialShows}
        theatres={["Test Theatre"]}
        genres={["drama"]}
        availableGenres={["drama"]}
        filters={baseFilters}
        hasMore={true}
      />,
    );

    await act(async () => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    await waitFor(() => {
      expect(screen.getByText("Show 13")).toBeInTheDocument();
    });

    // There should be exactly one Show 12 (the original, not the duplicate)
    const show12Elements = screen.getAllByText("Show 12");
    expect(show12Elements).toHaveLength(1);
  });

  it("shows skeleton cards while loading", async () => {
    // Make fetch hang indefinitely
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <ShowsContent
        shows={initialShows}
        theatres={["Test Theatre"]}
        genres={["drama"]}
        availableGenres={["drama"]}
        filters={baseFilters}
        hasMore={true}
      />,
    );

    await act(async () => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    // Skeleton cards should be rendered (they have aria-hidden="true")
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    // At least 4 skeletons + sentinel
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });

  it("shows empty state when no shows match", () => {
    render(
      <ShowsContent
        shows={[]}
        theatres={["Test Theatre"]}
        genres={["drama"]}
        availableGenres={["drama"]}
        filters={{ ...baseFilters, total: 0 }}
        hasMore={false}
      />,
    );

    expect(screen.getByText("לא נמצאו הצגות לפי החיפוש.")).toBeInTheDocument();
  });

  it("shows filter chips when filters are active", () => {
    render(
      <ShowsContent
        shows={initialShows}
        theatres={["Test Theatre"]}
        genres={["drama"]}
        availableGenres={["drama"]}
        filters={{ ...baseFilters, theatre: "Habima", genres: ["drama"] }}
        hasMore={true}
      />,
    );

    expect(screen.getByText("מסונן לפי:")).toBeInTheDocument();
    expect(screen.getByText("Habima")).toBeInTheDocument();
    // "drama" appears in filter chip, genre toggle, and show card tags
    const dramaFilterChip = screen.getByText("drama", { selector: ".filterChip" });
    expect(dramaFilterChip).toBeInTheDocument();
  });
});
