jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    show: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/seo", () => ({
  toAbsoluteUrl: (p: string) => `https://example.com${p}`,
}));

jest.mock("@/constants/routes", () => ({
  __esModule: true,
  default: {
    HOME: "/",
    SHOWS: "/shows",
    CONTACT: "/contact",
    EVENTS: "/events",
    THEATRES: "/theatres",
    GENRES: "/genres",
    CITIES: "/cities",
  },
  showPath: (slug: string) => `/shows/${slug}`,
  showReviewsPath: (slug: string) => `/shows/${slug}/reviews`,
  eventsPath: (segments: string[]) => `/events/${segments.join("/")}`,
  theatrePath: (slug: string) => `/theatres/${slug}`,
  genrePath: (slug: string) => `/genres/${slug}`,
  cityPath: (slug: string) => `/cities/${slug}`,
}));

jest.mock("@/lib/eventsConstants", () => ({
  REGION_SLUGS: { center: "מרכז", north: "צפון" },
  CITY_SLUGS: { "tel-aviv": "תל אביב" },
}));

jest.mock("@/constants/theatres", () => ({
  THEATRES: [{ slug: "cameri", name: "הקאמרי", image: "" }],
}));

jest.mock("@/constants/genres", () => ({
  GENRES: [{ slug: "drama", name: "דרמה", description: "", image: "" }],
}));

jest.mock("@/constants/cities", () => ({
  CITIES: [
    {
      slug: "tel-aviv",
      name: "תל אביב",
      aliases: [],
      description: "",
      residentTheatres: [],
      image: "",
    },
  ],
}));

import sitemap from "@/app/sitemap";
import prisma from "@/lib/prisma";

describe("sitemap()", () => {
  beforeEach(() => jest.clearAllMocks());

  it("includes static routes", async () => {
    jest.mocked(prisma.show.findMany).mockResolvedValue([]);
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain("https://example.com/");
    expect(urls).toContain("https://example.com/shows");
    expect(urls).toContain("https://example.com/contact");
  });

  it("includes theatre routes", async () => {
    jest.mocked(prisma.show.findMany).mockResolvedValue([]);
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain("https://example.com/theatres/cameri");
  });

  it("includes genre routes", async () => {
    jest.mocked(prisma.show.findMany).mockResolvedValue([]);
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain("https://example.com/genres/drama");
  });

  it("includes city routes", async () => {
    jest.mocked(prisma.show.findMany).mockResolvedValue([]);
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain("https://example.com/cities/tel-aviv");
  });

  it("includes show routes from DB", async () => {
    jest.mocked(prisma.show.findMany).mockResolvedValue([
      { slug: "hamlet", reviewCount: 3, reviews: [] },
    ] as any);
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain("https://example.com/shows/hamlet");
  });

  it("includes review routes only for shows with reviewCount >= 5", async () => {
    jest.mocked(prisma.show.findMany).mockResolvedValue([
      { slug: "hamlet", reviewCount: 3, reviews: [] },
      { slug: "othello", reviewCount: 10, reviews: [{ date: new Date() }] },
    ] as any);
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).not.toContain("https://example.com/shows/hamlet/reviews");
    expect(urls).toContain("https://example.com/shows/othello/reviews");
  });
});
