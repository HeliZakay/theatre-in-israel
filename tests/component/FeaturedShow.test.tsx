import { render, screen } from "@testing-library/react";
import FeaturedShow from "@/components/shows/FeaturedShow/FeaturedShow";

const baseProps = {
  title: "המלט",
  imageSrc: "/hamlet.webp",
};

function renderFeatured(
  overrides: Partial<React.ComponentProps<typeof FeaturedShow>> = {},
) {
  return render(<FeaturedShow {...baseProps} {...overrides} />);
}

describe("FeaturedShow", () => {
  it("renders the show title", () => {
    renderFeatured();
    expect(screen.getAllByText("המלט").length).toBeGreaterThan(0);
  });

  it("shows rating row when avgRating is a valid number", () => {
    renderFeatured({ avgRating: 4.3, reviewCount: 12 });
    expect(screen.getByText("4.3")).toBeInTheDocument();
    expect(screen.getByText("12 ביקורות")).toBeInTheDocument();
  });

  it("hides rating row when avgRating is null", () => {
    renderFeatured({ avgRating: null, reviewCount: 5 });
    expect(screen.queryByText("ביקורות")).not.toBeInTheDocument();
  });

  it("hides rating row when avgRating is NaN", () => {
    renderFeatured({ avgRating: NaN, reviewCount: 5 });
    expect(screen.queryByText("ביקורות")).not.toBeInTheDocument();
  });

  it("renders theatre when provided", () => {
    renderFeatured({ theatre: "תיאטרון הבימה" });
    expect(screen.getAllByText("תיאטרון הבימה").length).toBeGreaterThan(0);
  });

  it("does not render theatre text when not provided", () => {
    renderFeatured();
    expect(screen.queryByText("תיאטרון הבימה")).not.toBeInTheDocument();
  });

  it("renders tags from array", () => {
    renderFeatured({ tags: ["דרמה", "קלאסיקה"] });
    // Tags appear in both desktop and mobile views
    expect(screen.getAllByText("דרמה").length).toBeGreaterThan(0);
    expect(screen.getAllByText("קלאסיקה").length).toBeGreaterThan(0);
  });

  it("renders link overlay when href is provided", () => {
    renderFeatured({ href: "/shows/hamlet" });
    expect(
      screen.getByLabelText("לעמוד ההצגה המלט"),
    ).toHaveAttribute("href", "/shows/hamlet");
  });

  it("does not render link overlay when href is not provided", () => {
    renderFeatured();
    expect(screen.queryByLabelText(/לעמוד ההצגה/)).not.toBeInTheDocument();
  });

  it("renders quote and author", () => {
    renderFeatured({ quote: "הצגה מדהימה!", quoteAuthor: "שרה" });
    expect(screen.getByText("הצגה מדהימה!")).toBeInTheDocument();
    expect(screen.getByText("שרה")).toBeInTheDocument();
  });

  it("shows 'read more' for long quotes (> 200 chars)", () => {
    const longQuote = "א".repeat(201);
    renderFeatured({ quote: longQuote });
    expect(screen.getByText("קרא עוד")).toBeInTheDocument();
  });

  it("does not show 'read more' for short quotes", () => {
    renderFeatured({ quote: "קצר" });
    expect(screen.queryByText("קרא עוד")).not.toBeInTheDocument();
  });
});
