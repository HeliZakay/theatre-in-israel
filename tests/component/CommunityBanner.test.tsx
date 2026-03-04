import { render, screen } from "@testing-library/react";
import CommunityBanner from "@/components/CommunityBanner/CommunityBanner";

// Mock the client island — CommunityBannerHeadline
jest.mock("@/components/CommunityBanner/CommunityBannerHeadline", () => {
  const MockHeadline = () => <h2>mock headline</h2>;
  MockHeadline.displayName = "MockCommunityBannerHeadline";
  return { __esModule: true, default: MockHeadline };
});

// Mock CommunityBannerGrid — renders pool prop for verification
jest.mock("@/components/CommunityBanner/CommunityBannerGrid", () => {
  const MockGrid = ({
    pool,
  }: {
    pool: Array<{ id: number; slug: string }>;
  }) => (
    <div data-testid="community-grid">
      {pool.map((s) => (
        <span key={s.id}>{s.slug}</span>
      ))}
    </div>
  );
  MockGrid.displayName = "MockCommunityBannerGrid";
  return { __esModule: true, default: MockGrid };
});

const mockShows = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  slug: `show-${i + 1}`,
  title: `הצגה ${i + 1}`,
  theatre: `תיאטרון ${i % 4}`,
}));

describe("CommunityBanner", () => {
  it("passes all shows to the grid as pool", () => {
    render(<CommunityBanner shows={mockShows} />);
    const grid = screen.getByTestId("community-grid");
    mockShows.forEach((show) => {
      expect(grid).toHaveTextContent(show.slug);
    });
  });

  it("has an accessible section label", () => {
    render(<CommunityBanner shows={mockShows} />);
    expect(
      screen.getByRole("region", { name: "הצטרפו לקהילה" }),
    ).toBeInTheDocument();
  });

  it("renders the headline island", () => {
    render(<CommunityBanner shows={mockShows} />);
    expect(
      screen.getByRole("heading", { name: "mock headline" }),
    ).toBeInTheDocument();
  });
});
