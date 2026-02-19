import {
  buildShowsQueryString,
  parseShowsSearchParams,
} from "@/utils/showsQuery";

const DEFAULT_SORT = "rating";

describe("buildShowsQueryString", () => {
  it("returns empty string when no params", () => {
    expect(buildShowsQueryString()).toBe("");
    expect(buildShowsQueryString({})).toBe("");
  });

  it("includes query param", () => {
    expect(buildShowsQueryString({ query: "hamlet" })).toBe("?query=hamlet");
  });

  it("includes theatre param", () => {
    expect(buildShowsQueryString({ theatre: "Habima" })).toBe(
      "?theatre=Habima",
    );
  });

  it("appends multiple genre params", () => {
    const result = buildShowsQueryString({ genres: ["drama", "comedy"] });
    expect(result).toBe("?genre=drama&genre=comedy");
  });

  it("skips empty genre strings in array", () => {
    const result = buildShowsQueryString({ genres: ["drama", "", "comedy"] });
    expect(result).toBe("?genre=drama&genre=comedy");
  });

  it("omits sort when it equals DEFAULT_SORT", () => {
    const result = buildShowsQueryString({ sort: DEFAULT_SORT });
    expect(result).toBe("");
  });

  it("includes sort when different from default", () => {
    const result = buildShowsQueryString({ sort: "date" });
    expect(result).toBe("?sort=date");
  });

  it("omits page when <= 1", () => {
    expect(buildShowsQueryString({ page: 1 })).toBe("");
    expect(buildShowsQueryString({ page: 0 })).toBe("");
  });

  it("includes page when > 1", () => {
    expect(buildShowsQueryString({ page: 3 })).toBe("?page=3");
  });

  it("combines multiple params", () => {
    const result = buildShowsQueryString({
      query: "hamlet",
      theatre: "Habima",
      genres: ["drama"],
      sort: "date",
      page: 2,
    });
    expect(result).toBe(
      "?query=hamlet&theatre=Habima&genre=drama&sort=date&page=2",
    );
  });
});

describe("parseShowsSearchParams", () => {
  it("returns defaults when no params", () => {
    const result = parseShowsSearchParams();
    expect(result).toEqual({
      theatre: "",
      query: "",
      genres: [],
      sort: DEFAULT_SORT,
      page: 1,
    });
  });

  it("parses theatre as string", () => {
    const result = parseShowsSearchParams({ theatre: "Habima" });
    expect(result.theatre).toBe("Habima");
  });

  it("handles theatre as array (takes first)", () => {
    const result = parseShowsSearchParams({
      theatre: ["Habima", "Cameri"],
    });
    expect(result.theatre).toBe("Habima");
  });

  it("parses single genre into array", () => {
    const result = parseShowsSearchParams({ genre: "drama" });
    expect(result.genres).toEqual(["drama"]);
  });

  it("parses genre array", () => {
    const result = parseShowsSearchParams({
      genre: ["drama", "comedy"],
    });
    expect(result.genres).toEqual(["drama", "comedy"]);
  });

  it("truncates query to 200 characters", () => {
    const longQuery = "a".repeat(300);
    const result = parseShowsSearchParams({ query: longQuery });
    expect(result.query).toHaveLength(200);
  });

  it("parses valid page number", () => {
    const result = parseShowsSearchParams({ page: "5" });
    expect(result.page).toBe(5);
  });

  it("defaults page to 1 for invalid input", () => {
    const result = parseShowsSearchParams({ page: "abc" });
    expect(result.page).toBe(1);
  });

  it("clamps page to minimum of 1", () => {
    expect(parseShowsSearchParams({ page: "0" }).page).toBe(1);
    expect(parseShowsSearchParams({ page: "-1" }).page).toBe(1);
  });

  it("uses DEFAULT_SORT when sort not provided", () => {
    const result = parseShowsSearchParams({});
    expect(result.sort).toBe(DEFAULT_SORT);
  });
});
