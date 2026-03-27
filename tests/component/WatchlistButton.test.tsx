import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WatchlistButton from "@/components/shows/WatchlistButton/WatchlistButton";
import { useSession } from "next-auth/react";
import {
  addToWatchlistAction,
  removeFromWatchlistAction,
} from "@/lib/watchlistActions";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

jest.mock("@/lib/watchlistActions", () => ({
  addToWatchlistAction: jest.fn(),
  removeFromWatchlistAction: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

function renderButton(
  props: Partial<React.ComponentProps<typeof WatchlistButton>> = {},
) {
  return render(
    <WatchlistButton
      showId={42}
      showSlug="test-show"
      initialInWatchlist={false}
      {...props}
    />,
  );
}

describe("WatchlistButton", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockPush.mockClear();
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    });
  });

  it("shows 'add to watchlist' text when not in watchlist", () => {
    renderButton({ initialInWatchlist: false });
    expect(
      screen.getByRole("button", { name: /הוסיפ.י לרשימת צפייה/ }),
    ).toBeInTheDocument();
  });

  it("shows 'in watchlist' text when already in watchlist", () => {
    renderButton({ initialInWatchlist: true });
    expect(
      screen.getByRole("button", { name: /ברשימת הצפייה/ }),
    ).toBeInTheDocument();
  });

  it("redirects to signin when user is not authenticated", async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/auth/signin"),
    );
  });

  it("adds to watchlist on click (POST)", async () => {
    const user = userEvent.setup();
    (addToWatchlistAction as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: undefined,
    });

    renderButton({ showId: 42, initialInWatchlist: false });

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(addToWatchlistAction).toHaveBeenCalledWith(42);
    });

    // Optimistic: button should show "in watchlist" text
    expect(
      screen.getByRole("button", { name: /ברשימת הצפייה/ }),
    ).toBeInTheDocument();
  });

  it("removes from watchlist on click (DELETE)", async () => {
    const user = userEvent.setup();
    (removeFromWatchlistAction as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: undefined,
    });

    renderButton({ showId: 42, initialInWatchlist: true });

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(removeFromWatchlistAction).toHaveBeenCalledWith(42);
    });
  });

  it("reverts state on API failure", async () => {
    const user = userEvent.setup();
    (addToWatchlistAction as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: "error",
    });

    renderButton({ showId: 42, initialInWatchlist: false });

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      // Should revert to "add" state after failure
      expect(
        screen.getByRole("button", { name: /הוסיפ.י לרשימת צפייה/ }),
      ).toBeInTheDocument();
    });
  });

  it("reverts state on network error", async () => {
    const user = userEvent.setup();
    (addToWatchlistAction as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    renderButton({ showId: 42, initialInWatchlist: false });

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /הוסיפ.י לרשימת צפייה/ }),
      ).toBeInTheDocument();
    });
  });

  it("disables button while loading", async () => {
    const user = userEvent.setup();
    // Use a never-resolving promise to keep loading state
    (addToWatchlistAction as jest.Mock).mockReturnValue(new Promise(() => {}));

    renderButton();

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveTextContent("...");
  });
});
