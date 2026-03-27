// tests/component/DeleteReviewButton.test.tsx

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteReviewButton from "@/components/reviews/DeleteReviewButton/DeleteReviewButton";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

const mockDeleteReview = jest.fn();
jest.mock("@/app/reviews/actions", () => ({
  deleteReview: (...args: unknown[]) => mockDeleteReview(...args),
}));

beforeEach(() => {
  mockDeleteReview.mockReset();
  mockRefresh.mockReset();
});

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("DeleteReviewButton", () => {
  it('renders trigger button with "מחיקה" text', () => {
    render(<DeleteReviewButton reviewId={1} />);
    expect(screen.getByRole("button", { name: "מחיקה" })).toBeInTheDocument();
  });

  it("opens confirmation dialog on click", async () => {
    const user = userEvent.setup();
    render(<DeleteReviewButton reviewId={1} />);

    await user.click(screen.getByRole("button", { name: "מחיקה" }));

    expect(screen.getByText("מחק.י ביקורת")).toBeInTheDocument();
    expect(
      screen.getByText("למחוק את הביקורת? לא ניתן לשחזר פעולה זו."),
    ).toBeInTheDocument();
  });

  it("calls deleteReview and refreshes on success", async () => {
    mockDeleteReview.mockResolvedValue({ success: true });
    const user = userEvent.setup();

    render(<DeleteReviewButton reviewId={42} />);

    await user.click(screen.getByRole("button", { name: "מחיקה" }));

    // Click confirm button inside dialog
    const confirmButtons = screen.getAllByRole("button", { name: "מחיקה" });
    const confirmBtn = confirmButtons[confirmButtons.length - 1];
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteReview).toHaveBeenCalledWith(42);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows error message when result.success is false", async () => {
    mockDeleteReview.mockResolvedValue({
      success: false,
      error: "אין הרשאה למחיקה",
    });
    const user = userEvent.setup();

    render(<DeleteReviewButton reviewId={1} />);

    await user.click(screen.getByRole("button", { name: "מחיקה" }));

    const confirmButtons = screen.getAllByRole("button", { name: "מחיקה" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText("אין הרשאה למחיקה")).toBeInTheDocument();
    });

    // Dialog stays open with "סגירה" button
    expect(screen.getByRole("button", { name: "סגירה" })).toBeInTheDocument();
  });

  it("catches thrown exception and displays error", async () => {
    mockDeleteReview.mockRejectedValue(new Error("Network error"));
    const user = userEvent.setup();

    render(<DeleteReviewButton reviewId={1} />);

    await user.click(screen.getByRole("button", { name: "מחיקה" }));

    const confirmButtons = screen.getAllByRole("button", { name: "מחיקה" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it('shows "מוחקים..." during deletion', async () => {
    // Never resolves — stays loading
    mockDeleteReview.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();

    render(<DeleteReviewButton reviewId={1} />);

    await user.click(screen.getByRole("button", { name: "מחיקה" }));

    const confirmButtons = screen.getAllByRole("button", { name: "מחיקה" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText("מוחקים...")).toBeInTheDocument();
    });
  });

  it("disables cancel button during deletion", async () => {
    mockDeleteReview.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();

    render(<DeleteReviewButton reviewId={1} />);

    await user.click(screen.getByRole("button", { name: "מחיקה" }));

    const confirmButtons = screen.getAllByRole("button", { name: "מחיקה" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "ביטול" })).toBeDisabled();
    });
  });
});
