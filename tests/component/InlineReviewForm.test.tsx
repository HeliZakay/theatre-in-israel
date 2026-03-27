jest.mock("@/app/reviews/actions", () => ({
  createReview: jest.fn(),
  createAnonymousReview: jest.fn(),
}));

jest.mock("@/components/ui/AppSelect/AppSelect", () => {
  const MockAppSelect = ({
    value,
    onValueChange,
    options = [],
    placeholder,
    id,
    ariaLabel,
    disabled,
    onBlur,
  }: {
    value?: string;
    onValueChange?: (v: string) => void;
    options?: { value: string; label: string }[];
    placeholder?: string;
    id?: string;
    ariaLabel?: string;
    disabled?: boolean;
    onBlur?: () => void;
  }) => (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      data-testid="rating-select"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
  MockAppSelect.displayName = "MockAppSelect";
  return { __esModule: true, default: MockAppSelect };
});

let mockReplace: jest.Mock;
const stableReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: (mockReplace = stableReplace),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/shows/test-show",
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InlineReviewForm from "@/components/reviews/InlineReviewForm/InlineReviewForm";
import {
  createReview,
  createAnonymousReview,
} from "@/app/reviews/actions";

const baseProps = {
  showId: 42,
  showSlug: "hamlet",
  showTitle: "המלט",
  isAuthenticated: true,
  variant: "empty" as const,
};

function renderForm(
  overrides: Partial<React.ComponentProps<typeof InlineReviewForm>> = {},
) {
  return render(<InlineReviewForm {...baseProps} {...overrides} />);
}

describe("InlineReviewForm", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    stableReplace.mockClear();
  });

  // ── Collapsed state ──

  it("is collapsed by default with aria-hidden='true' and star hint visible", () => {
    renderForm();
    const expandWrapper = screen.getByText("לחצו על כוכב כדי להתחיל").closest(
      "[aria-hidden]",
    )?.parentElement?.querySelector("[aria-hidden]");
    // The expand wrapper div has aria-hidden when collapsed
    expect(
      document.querySelector("[aria-hidden='true']"),
    ).toBeInTheDocument();
    expect(screen.getByText("לחצו על כוכב כדי להתחיל")).toBeInTheDocument();
  });

  // ── Variant text ──

  it('variant "empty" shows correct prompt text', () => {
    renderForm({ variant: "empty" });
    expect(
      screen.getByText("היו הראשונים לכתוב ביקורת!"),
    ).toBeInTheDocument();
  });

  it('variant "after-reviews" shows alternate prompt text', () => {
    renderForm({ variant: "after-reviews" });
    expect(
      screen.getByText("ראיתם את ההצגה? ספרו מה חשבתם"),
    ).toBeInTheDocument();
  });

  // ── Expanding ──

  it("clicking a star expands the form", async () => {
    const user = userEvent.setup();
    renderForm();

    // Click the 4th star (aria-label "4 מתוך 5")
    const star = screen.getByRole("radio", { name: "4 מתוך 5" });
    await user.click(star);

    // After expand, the star hint should disappear
    expect(
      screen.queryByText("לחצו על כוכב כדי להתחיל"),
    ).not.toBeInTheDocument();
    // Submit button should now be visible
    expect(
      screen.getByRole("button", { name: "שלח.י ביקורת" }),
    ).toBeInTheDocument();
  });

  // ── Cancel ──

  it("cancel button resets and collapses the form", async () => {
    const user = userEvent.setup();
    renderForm();

    // Expand by clicking a star
    await user.click(screen.getByRole("radio", { name: "3 מתוך 5" }));
    expect(
      screen.getByRole("button", { name: "שלח.י ביקורת" }),
    ).toBeInTheDocument();

    // Click cancel
    await user.click(screen.getByRole("button", { name: "ביטול" }));

    // Star hint should reappear (collapsed)
    expect(screen.getByText("לחצו על כוכב כדי להתחיל")).toBeInTheDocument();
  });

  // ── Anonymous mode ──

  it("anonymous mode shows name field with 'אנונימי' placeholder", async () => {
    const user = userEvent.setup();
    renderForm({ isAuthenticated: false });

    // Expand so the form fields become visible
    await user.click(screen.getByRole("radio", { name: "3 מתוך 5" }));

    expect(screen.getByPlaceholderText("אנונימי")).toBeInTheDocument();
  });

  it("anonymous mode shows sign-in link", async () => {
    const user = userEvent.setup();
    renderForm({ isAuthenticated: false });

    // Expand so the sign-in banner becomes visible
    await user.click(screen.getByRole("radio", { name: "3 מתוך 5" }));

    expect(screen.getByText(/יש לך חשבון/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "התחבר.י" })).toBeInTheDocument();
  });

  // ── Successful authenticated submission ──

  it("successful authenticated submission calls createReview and router.replace", async () => {
    const user = userEvent.setup();
    (createReview as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { showId: 42, reviewCount: 5 },
    });

    renderForm();

    // Select rating star
    await user.click(screen.getByRole("radio", { name: "5 מתוך 5" }));

    // Fill text
    const textarea = screen.getByRole("textbox", { name: /תגובה/i });
    await user.type(textarea, "הצגה מדהימה! ממליץ/ה בחום");

    // Submit
    await user.click(screen.getByRole("button", { name: "שלח.י ביקורת" }));

    await waitFor(() => {
      expect(createReview).toHaveBeenCalledWith(expect.any(FormData));
    });

    await waitFor(() => {
      expect(stableReplace).toHaveBeenCalledWith(
        "/shows/hamlet?review=success&count=5",
        { scroll: false },
      );
    });
  });

  // ── Anonymous submission ──

  it("anonymous submission calls createAnonymousReview", async () => {
    const user = userEvent.setup();
    (createAnonymousReview as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { showId: 42 },
    });

    renderForm({ isAuthenticated: false });

    // Select rating star
    await user.click(screen.getByRole("radio", { name: "4 מתוך 5" }));

    // Fill text
    const textarea = screen.getByRole("textbox", { name: /תגובה/i });
    await user.type(textarea, "הצגה מדהימה! ממליץ/ה בחום");

    // Submit
    await user.click(screen.getByRole("button", { name: "שלח.י ביקורת" }));

    await waitFor(() => {
      expect(createAnonymousReview).toHaveBeenCalledWith(
        expect.any(FormData),
      );
    });
  });

  // ── Server error ──

  it("server error is displayed on failed action", async () => {
    const user = userEvent.setup();
    (createReview as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: "שגיאה בשרת",
    });

    renderForm();

    // Expand + fill
    await user.click(screen.getByRole("radio", { name: "3 מתוך 5" }));
    const textarea = screen.getByRole("textbox", { name: /תגובה/i });
    await user.type(textarea, "הצגה לא רעה בכלל הצגה מצוינת");

    await user.click(screen.getByRole("button", { name: "שלח.י ביקורת" }));

    await waitFor(() => {
      expect(screen.getByText("שגיאה בשרת")).toBeInTheDocument();
    });
  });
});
