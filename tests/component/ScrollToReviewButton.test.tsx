import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScrollToReviewButton from "@/components/ScrollToReviewButton/ScrollToReviewButton";

describe("ScrollToReviewButton", () => {
  // ── getButtonLabel ──

  it("returns first-review label when reviewCount is 0", () => {
    render(<ScrollToReviewButton reviewCount={0} avgRating={null} />);
    expect(screen.getByText(/היו הראשונים לדרג/)).toBeInTheDocument();
  });

  it("returns join label when reviewCount is between 1 and 5", () => {
    render(<ScrollToReviewButton reviewCount={3} avgRating={4} />);
    expect(screen.getByText("הצטרפו ל-3 ביקורות")).toBeInTheDocument();
  });

  it("returns write-review label when reviewCount is 6 or more", () => {
    render(<ScrollToReviewButton reviewCount={10} avgRating={4.5} />);
    expect(screen.getByText("כתב.י ביקורת")).toBeInTheDocument();
  });

  // ── Element type ──

  it("renders a link when href prop is given", () => {
    render(
      <ScrollToReviewButton
        reviewCount={0}
        avgRating={null}
        href="/shows/hamlet#write-review"
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/shows/hamlet#write-review");
  });

  it("renders a button when no href prop is given", () => {
    render(<ScrollToReviewButton reviewCount={0} avgRating={null} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  // ── Click handler ──

  it("calls scrollIntoView on the target element when clicked", async () => {
    const user = userEvent.setup();
    const scrollIntoView = jest.fn();

    // Create the target element in the document
    const target = document.createElement("div");
    target.id = "write-review";
    target.scrollIntoView = scrollIntoView;
    document.body.appendChild(target);

    render(<ScrollToReviewButton reviewCount={0} avgRating={null} />);
    await user.click(screen.getByRole("button"));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });

    document.body.removeChild(target);
  });
});
