jest.mock("@/app/reviews/actions", () => ({
  createReview: jest.fn(),
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewForm from "@/components/ReviewForm/ReviewForm";
import type { ShowOption } from "@/components/ReviewForm/ReviewForm";
import { createReview } from "@/app/reviews/actions";

// ---------- Mock Radix Select used inside ReviewFormFields ----------
// Radix Select uses portals and complex internals that are hard to test with
// jsdom. Replace AppSelect with a plain `<select>` for form integration tests.
jest.mock("@/components/AppSelect/AppSelect", () => {
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

const SHOWS: ShowOption[] = [
  { id: 1, title: "המלט" },
  { id: 2, title: "קברט" },
  { id: 3, title: "קזבלן" },
];

let mockPush: jest.Mock;
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (mockPush = jest.fn()),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

function renderReviewForm(
  props: Partial<React.ComponentProps<typeof ReviewForm>> = {},
) {
  return render(<ReviewForm shows={SHOWS} {...props} />);
}

describe("ReviewForm", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  // ── Rendering ──

  it("renders the form with show combobox when shows are provided", () => {
    renderReviewForm();
    expect(screen.getByPlaceholderText("חפש.י הצגה…")).toBeInTheDocument();
  });

  it("renders hidden input when shows list is empty", () => {
    const { container } = render(<ReviewForm shows={[]} />);
    const hidden = container.querySelector('input[type="hidden"]');
    expect(hidden).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("חפש.י הצגה…"),
    ).not.toBeInTheDocument();
  });

  it("renders title, rating, and text fields", () => {
    renderReviewForm();
    expect(screen.getByText("כותרת הביקורת")).toBeInTheDocument();
    expect(screen.getByLabelText("דירוג")).toBeInTheDocument();
    expect(screen.getByText("תגובה")).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    renderReviewForm();
    expect(
      screen.getByRole("button", { name: "שליחת ביקורת" }),
    ).toBeInTheDocument();
  });

  // ── Validation ──

  it("shows validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    renderReviewForm();

    const submitBtn = screen.getByRole("button", { name: "שליחת ביקורת" });
    await user.click(submitBtn);

    await waitFor(() => {
      // At minimum, the show selection error should appear
      expect(screen.getByText("יש לבחור הצגה")).toBeInTheDocument();
    });
  });

  it("shows title validation error for too-short title", async () => {
    const user = userEvent.setup();
    renderReviewForm({ initialShowId: 1 });

    // Fill just a one-char title (minimum is 2)
    const titleInput = screen.getByRole("textbox", { name: /כותרת/i });
    await user.type(titleInput, "a");

    const submitBtn = screen.getByRole("button", { name: "שליחת ביקורת" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("הכניס.י כותרת")).toBeInTheDocument();
    });
  });

  it("shows text validation error for too-short text", async () => {
    const user = userEvent.setup();
    renderReviewForm({ initialShowId: 1 });

    const titleInput = screen.getByRole("textbox", { name: /כותרת/i });
    await user.type(titleInput, "כותרת טובה");

    // Select rating
    const rating = screen.getByTestId("rating-select");
    await user.selectOptions(rating, "5");

    // Type short text (min 10)
    const textarea = screen.getByRole("textbox", { name: /תגובה/i });
    await user.type(textarea, "קצר");

    const submitBtn = screen.getByRole("button", { name: "שליחת ביקורת" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/תגובה צריכה להכיל לפחות/)).toBeInTheDocument();
    });
  });

  // ── Successful submission ──

  it("submits the form and shows success message", async () => {
    const user = userEvent.setup();
    (createReview as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { showId: 1 },
    });

    renderReviewForm({ initialShowId: 1 });

    // Fill title
    const titleInput = screen.getByRole("textbox", { name: /כותרת/i });
    await user.type(titleInput, "ביקורת נהדרת");

    // Select rating
    const rating = screen.getByTestId("rating-select");
    await user.selectOptions(rating, "5");

    // Fill text
    const textarea = screen.getByRole("textbox", { name: /תגובה/i });
    await user.type(textarea, "הצגה מדהימה! ממליץ/ה בחום");

    // Submit
    const submitBtn = screen.getByRole("button", { name: "שליחת ביקורת" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("הביקורת נשלחה בהצלחה")).toBeInTheDocument();
    });

    expect(createReview).toHaveBeenCalledWith(expect.any(FormData));
  });

  it("disables submit button after successful submission", async () => {
    const user = userEvent.setup();
    (createReview as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { showId: 1 },
    });

    renderReviewForm({ initialShowId: 1 });

    const titleInput = screen.getByRole("textbox", { name: /כותרת/i });
    await user.type(titleInput, "ביקורת נהדרת");

    const rating = screen.getByTestId("rating-select");
    await user.selectOptions(rating, "4");

    const textarea = screen.getByRole("textbox", { name: /תגובה/i });
    await user.type(textarea, "הצגה מדהימה! ממליץ/ה בחום");

    const submitBtn = screen.getByRole("button", { name: "שליחת ביקורת" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "נשלח" })).toBeDisabled();
    });
  });

  // ── Server error ──

  it("shows server error when submission fails", async () => {
    const user = userEvent.setup();
    (createReview as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: "שגיאה בשרת",
    });

    renderReviewForm({ initialShowId: 1 });

    const titleInput = screen.getByRole("textbox", { name: /כותרת/i });
    await user.type(titleInput, "ביקורת נהדרת");

    const rating = screen.getByTestId("rating-select");
    await user.selectOptions(rating, "3");

    const textarea = screen.getByRole("textbox", { name: /תגובה/i });
    await user.type(textarea, "הצגה לא רעה בכלל הצגה מצוינת");

    const submitBtn = screen.getByRole("button", { name: "שליחת ביקורת" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("שגיאה בשרת")).toBeInTheDocument();
    });
  });

  it("shows error from server action", async () => {
    const user = userEvent.setup();
    (createReview as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: "שגיאה במהלך שליחת הבקשה",
    });

    renderReviewForm({ initialShowId: 1 });

    const titleInput = screen.getByRole("textbox", { name: /כותרת/i });
    await user.type(titleInput, "ביקורת נהדרת");

    const rating = screen.getByTestId("rating-select");
    await user.selectOptions(rating, "3");

    const textarea = screen.getByRole("textbox", { name: /תגובה/i });
    await user.type(textarea, "הצגה לא רעה בכלל הצגה מצוינת");

    const submitBtn = screen.getByRole("button", { name: "שליחת ביקורת" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("שגיאה במהלך שליחת הבקשה")).toBeInTheDocument();
    });
  });

  it("shows network error message when fetch throws", async () => {
    const user = userEvent.setup();
    (createReview as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    renderReviewForm({ initialShowId: 1 });

    const titleInput = screen.getByRole("textbox", { name: /כותרת/i });
    await user.type(titleInput, "ביקורת נהדרת");

    const rating = screen.getByTestId("rating-select");
    await user.selectOptions(rating, "3");

    const textarea = screen.getByRole("textbox", { name: /תגובה/i });
    await user.type(textarea, "הצגה לא רעה בכלל הצגה מצוינת");

    const submitBtn = screen.getByRole("button", { name: "שליחת ביקורת" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  // ── Show poster ──

  it("shows poster panel when a show is selected", () => {
    renderReviewForm({ initialShowId: 1 });
    expect(screen.getByLabelText("פוסטר של המלט")).toBeInTheDocument();
  });

  it("does not show poster panel when no show is selected", () => {
    renderReviewForm();
    expect(screen.queryByLabelText(/פוסטר של/)).not.toBeInTheDocument();
  });

  // ── Character counters ──

  it("updates character counter as user types", async () => {
    const user = userEvent.setup();
    renderReviewForm({ initialShowId: 1 });

    const titleInput = screen.getByRole("textbox", { name: /כותרת/i });
    await user.type(titleInput, "test");

    expect(screen.getByText("4/120")).toBeInTheDocument();
  });
});
