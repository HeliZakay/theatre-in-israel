import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WatchlistButton from "@/components/shows/WatchlistButton/WatchlistButton";
import { useWatchlist } from "@/components/auth/WatchlistProvider/WatchlistProvider";

jest.mock("@/components/auth/WatchlistProvider/WatchlistProvider", () => ({
  useWatchlist: jest.fn(),
}));

const mockToggle = jest.fn();

function renderButton(
  props: Partial<React.ComponentProps<typeof WatchlistButton>> = {},
) {
  return render(
    <WatchlistButton showId={42} showSlug="test-show" {...props} />,
  );
}

describe("WatchlistButton", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockToggle.mockClear();
    (useWatchlist as jest.Mock).mockReturnValue({
      isInWatchlist: () => false,
      toggle: mockToggle,
    });
  });

  it("shows 'add to watchlist' text when not in watchlist", () => {
    (useWatchlist as jest.Mock).mockReturnValue({
      isInWatchlist: () => false,
      toggle: mockToggle,
    });
    renderButton();
    expect(
      screen.getByRole("button", { name: /הוסיפ.י לרשימת צפייה/ }),
    ).toBeInTheDocument();
  });

  it("shows 'in watchlist' text when already in watchlist", () => {
    (useWatchlist as jest.Mock).mockReturnValue({
      isInWatchlist: () => true,
      toggle: mockToggle,
    });
    renderButton();
    expect(
      screen.getByRole("button", { name: /ברשימת הצפייה/ }),
    ).toBeInTheDocument();
  });

  it("calls toggle with showId and showSlug on click", async () => {
    const user = userEvent.setup();
    renderButton({ showId: 42, showSlug: "test-show" });

    await user.click(screen.getByRole("button"));

    expect(mockToggle).toHaveBeenCalledWith(42, "test-show");
  });

  it("applies active class when in watchlist", () => {
    (useWatchlist as jest.Mock).mockReturnValue({
      isInWatchlist: () => true,
      toggle: mockToggle,
    });
    renderButton();
    const button = screen.getByRole("button");
    expect(button.className).toMatch(/active/);
  });
});
