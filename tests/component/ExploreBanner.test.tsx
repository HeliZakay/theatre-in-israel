import { render, screen } from "@testing-library/react";
import ExploreBanner from "@/components/ExploreBanner/ExploreBanner";

// Mock the headline sub-component
jest.mock("@/components/ExploreBanner/ExploreBannerHeadline", () => {
  const MockHeadline = () => <h2>mock headline</h2>;
  MockHeadline.displayName = "MockExploreBannerHeadline";
  return { __esModule: true, default: MockHeadline };
});

// Mock ExploreBannerGrid — renders pool prop for verification
jest.mock("@/components/ExploreBanner/ExploreBannerGrid", () => {
  const MockGrid = ({
    pool,
  }: {
    pool: Array<{ id: number; slug: string }>;
  }) => (
    <div data-testid="explore-grid">
      {pool.map((s) => (
        <span key={s.id}>{s.slug}</span>
      ))}
    </div>
  );
  MockGrid.displayName = "MockExploreBannerGrid";
  return { __esModule: true, default: MockGrid };
});

const mockShows = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  slug: `show-${i + 1}`,
  title: `הצגה ${i + 1}`,
  theatre: `תיאטרון ${i % 4}`,
  genre: ["דרמה"],
  avgRating: i % 2 === 0 ? 4.5 : null,
}));

describe("ExploreBanner", () => {
  it("passes all shows to the grid as pool", () => {
    render(<ExploreBanner shows={mockShows} />);
    const grid = screen.getByTestId("explore-grid");
    mockShows.forEach((show) => {
      expect(grid).toHaveTextContent(show.slug);
    });
  });

  it("has an accessible section label", () => {
    render(<ExploreBanner shows={mockShows} />);
    expect(
      screen.getByRole("region", { name: "גלו הצגות" }),
    ).toBeInTheDocument();
  });

  it("renders the headline island", () => {
    render(<ExploreBanner shows={mockShows} />);
    expect(
      screen.getByRole("heading", { name: "mock headline" }),
    ).toBeInTheDocument();
  });
});
