import { render, screen, fireEvent, act } from "@testing-library/react";
import ExploreBannerGrid from "@/components/ExploreBanner/ExploreBannerGrid";

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
  genre: ["דרמה"],
  avgRating: i % 2 === 0 ? 4.5 : null,
}));

describe("ExploreBannerGrid", () => {
  const initial = mockPool.slice(0, 4);

  it("renders exactly 4 show cards plus browse link", () => {
    render(<ExploreBannerGrid pool={mockPool} initial={initial} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
  });

  it("each card links to the show page", () => {
    render(<ExploreBannerGrid pool={mockPool} initial={initial} />);
    const links = screen.getAllByRole("link");
    const showLinks = links.filter((link) =>
      /^\/shows\/show-\d+$/.test(link.getAttribute("href") ?? ""),
    );
    expect(showLinks).toHaveLength(4);
    showLinks.forEach((link) => {
      expect(link).toHaveAttribute(
        "href",
        expect.stringMatching(/^\/shows\/show-\d+$/),
      );
    });
  });

  it("renders show images with alt text", () => {
    render(<ExploreBannerGrid pool={mockPool} initial={initial} />);
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(4);
    images.forEach((img) => {
      expect(img).toHaveAttribute("alt", expect.stringMatching(/^הצגה \d+$/));
    });
  });

  it("renders show titles", () => {
    render(<ExploreBannerGrid pool={mockPool} initial={initial} />);
    const links = screen.getAllByRole("link");
    // Filter to show card links only (exclude browse link)
    const showLinks = links.filter((link) =>
      /^\/shows\/show-\d+$/.test(link.getAttribute("href") ?? ""),
    );
    const titles = showLinks.map((link) => link.textContent);
    expect(titles).toHaveLength(4);
    titles.forEach((title) => {
      expect(title).toMatch(/הצגה \d+/);
    });
  });

  it("renders shuffle button", () => {
    render(<ExploreBannerGrid pool={mockPool} initial={initial} />);
    expect(
      screen.getByRole("button", { name: "ערבבו שוב" }),
    ).toBeInTheDocument();
  });

  it("shuffle button has accessible label", () => {
    render(<ExploreBannerGrid pool={mockPool} initial={initial} />);
    const button = screen.getByRole("button", { name: "ערבבו שוב" });
    expect(button).toHaveAttribute("aria-label", "ערבבו שוב");
  });

  it("initial render shows the first 4 from pool (no randomization)", () => {
    render(<ExploreBannerGrid pool={mockPool} initial={initial} />);
    const links = screen.getAllByRole("link");
    const showLinks = links.filter((l) =>
      /^\/shows\/show-\d+$/.test(l.getAttribute("href") ?? ""),
    );
    expect(showLinks.map((l) => l.getAttribute("href"))).toEqual([
      "/shows/show-1",
      "/shows/show-2",
      "/shows/show-3",
      "/shows/show-4",
    ]);
  });

  it("clicking shuffle changes displayed shows", () => {
    jest.useFakeTimers();
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);

    render(<ExploreBannerGrid pool={mockPool} initial={initial} />);

    const filterShowLinks = (links: HTMLElement[]) =>
      links.filter((l) =>
        /^\/shows\/show-\d+$/.test(l.getAttribute("href") ?? ""),
      );

    const titlesBefore = filterShowLinks(screen.getAllByRole("link")).map(
      (link) => link.textContent,
    );

    const button = screen.getByRole("button", { name: "ערבבו שוב" });
    fireEvent.click(button);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    const titlesAfter = filterShowLinks(screen.getAllByRole("link")).map(
      (link) => link.textContent,
    );

    // At least one displayed show should have changed
    const changed = titlesAfter.some((title, i) => title !== titlesBefore[i]);
    expect(changed).toBe(true);

    randomSpy.mockRestore();
    jest.useRealTimers();
  });
});
