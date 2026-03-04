import { render, screen, fireEvent, act } from "@testing-library/react";
import CommunityBannerGrid from "@/components/CommunityBanner/CommunityBannerGrid";

// Mock FallbackImage to a plain <img>
jest.mock("@/components/FallbackImage/FallbackImage", () => {
  const MockFallbackImage = (props: Record<string, unknown>) => {
    const { fill, sizes, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  };
  MockFallbackImage.displayName = "MockFallbackImage";
  return { __esModule: true, default: MockFallbackImage };
});

const mockPool = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  slug: `show-${i + 1}`,
  title: `הצגה ${i + 1}`,
  theatre: `תיאטרון ${i % 3}`,
}));

describe("CommunityBannerGrid", () => {
  it("renders exactly 4 show cards", () => {
    render(<CommunityBannerGrid pool={mockPool} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
  });

  it("each card links to the review page", () => {
    render(<CommunityBannerGrid pool={mockPool} />);
    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link).toHaveAttribute(
        "href",
        expect.stringMatching(/^\/shows\/show-\d+\/review$/),
      );
    });
  });

  it("renders show images with alt text", () => {
    render(<CommunityBannerGrid pool={mockPool} />);
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(4);
    images.forEach((img) => {
      expect(img).toHaveAttribute("alt", expect.stringMatching(/^הצגה \d+$/));
    });
  });

  it("renders show titles", () => {
    render(<CommunityBannerGrid pool={mockPool} />);
    const links = screen.getAllByRole("link");
    // Each link should contain a visible title text
    const titles = links.map((link) => link.textContent);
    expect(titles).toHaveLength(4);
    titles.forEach((title) => {
      expect(title).toMatch(/הצגה \d+/);
    });
  });

  it("renders shuffle button", () => {
    render(<CommunityBannerGrid pool={mockPool} />);
    expect(
      screen.getByRole("button", { name: "הצגות נוספות" }),
    ).toBeInTheDocument();
  });

  it("shuffle button has accessible label", () => {
    render(<CommunityBannerGrid pool={mockPool} />);
    const button = screen.getByRole("button", { name: "הצגות נוספות" });
    expect(button).toHaveAttribute("aria-label", "הצגות נוספות");
  });

  it("initial render shows the first 4 from pool (no randomization)", () => {
    render(<CommunityBannerGrid pool={mockPool} />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/shows/show-1/review",
      "/shows/show-2/review",
      "/shows/show-3/review",
      "/shows/show-4/review",
    ]);
  });

  it("clicking shuffle changes displayed shows", () => {
    jest.useFakeTimers();
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);

    render(<CommunityBannerGrid pool={mockPool} />);

    const titlesBefore = screen
      .getAllByRole("link")
      .map((link) => link.textContent);

    const button = screen.getByRole("button", { name: "הצגות נוספות" });
    fireEvent.click(button);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    const titlesAfter = screen
      .getAllByRole("link")
      .map((link) => link.textContent);

    // At least one displayed show should have changed
    const changed = titlesAfter.some((title, i) => title !== titlesBefore[i]);
    expect(changed).toBe(true);

    randomSpy.mockRestore();
    jest.useRealTimers();
  });
});
