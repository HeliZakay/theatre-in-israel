jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {},
}));

import { buildWhereClause, buildOrderBy } from "@/lib/data/showsList";
import { excludeKidsWhere } from "@/lib/showHelpers";

describe("buildWhereClause", () => {
  it("returns empty object for empty filters", () => {
    const result = buildWhereClause({ theatre: "", query: "", genres: [] });
    expect(result).toEqual({});
  });

  it("filters by theatre only", () => {
    const result = buildWhereClause({ theatre: "תיאטרון הקאמרי", query: "", genres: [] });
    expect(result).toEqual({
      AND: [{ theatre: "תיאטרון הקאמרי" }],
    });
  });

  it("filters by query across title, theatre, and genre", () => {
    const result = buildWhereClause({ theatre: "", query: "המלט", genres: [] });
    expect(result).toEqual({
      AND: [
        {
          OR: [
            { title: { contains: "המלט", mode: "insensitive" } },
            { theatre: { contains: "המלט", mode: "insensitive" } },
            {
              genres: {
                some: {
                  genre: { name: { contains: "המלט", mode: "insensitive" } },
                },
              },
            },
          ],
        },
      ],
    });
  });

  it("filters by genres", () => {
    const result = buildWhereClause({ theatre: "", query: "", genres: ["דרמה", "קומדיה"] });
    expect(result).toEqual({
      AND: [
        {
          genres: {
            some: {
              genre: { name: { in: ["דרמה", "קומדיה"] } },
            },
          },
        },
        excludeKidsWhere,
      ],
    });
  });

  it("combines theatre, query, and genres into AND", () => {
    const result = buildWhereClause({
      theatre: "תיאטרון הקאמרי",
      query: "המלט",
      genres: ["דרמה"],
    });

    expect(result).toHaveProperty("AND");
    const conditions = (result as { AND: unknown[] }).AND;
    expect(conditions).toHaveLength(4);
    expect(conditions[0]).toEqual({ theatre: "תיאטרון הקאמרי" });
    expect(conditions[1]).toHaveProperty("OR");
    expect(conditions[2]).toHaveProperty("genres");
    expect(conditions[3]).toEqual(excludeKidsWhere);
  });

  it("normalizes Hebrew geresh in query to ASCII apostrophe", () => {
    const result = buildWhereClause({ theatre: "", query: "צ\u05F3ילבות", genres: [] });
    expect(result).toEqual({
      AND: [
        {
          OR: [
            { title: { contains: "צ'ילבות", mode: "insensitive" } },
            { theatre: { contains: "צ'ילבות", mode: "insensitive" } },
            {
              genres: {
                some: {
                  genre: { name: { contains: "צ'ילבות", mode: "insensitive" } },
                },
              },
            },
          ],
        },
      ],
    });
  });

  it("handles single genre", () => {
    const result = buildWhereClause({ theatre: "", query: "", genres: ["דרמה"] });
    expect(result).toEqual({
      AND: [
        {
          genres: {
            some: {
              genre: { name: { in: ["דרמה"] } },
            },
          },
        },
        excludeKidsWhere,
      ],
    });
  });

  it("does not exclude kids when kids genre is selected", () => {
    const result = buildWhereClause({ theatre: "", query: "", genres: ["ילדים"] });
    expect(result).toEqual({
      AND: [
        {
          genres: {
            some: {
              genre: { name: { in: ["ילדים"] } },
            },
          },
        },
      ],
    });
  });
});

describe("buildOrderBy", () => {
  it("returns avgRating desc for 'rating'", () => {
    const result = buildOrderBy("rating");
    expect(result).toEqual([
      { avgRating: { sort: "desc", nulls: "last" } },
      { reviewCount: "desc" },
      { id: "asc" },
    ]);
  });

  it("returns avgRating asc for 'rating-asc'", () => {
    const result = buildOrderBy("rating-asc");
    expect(result).toEqual([
      { avgRating: { sort: "asc", nulls: "last" } },
      { reviewCount: "desc" },
      { id: "asc" },
    ]);
  });

  it("returns reviewCount desc then avgRating desc for 'reviews'", () => {
    const result = buildOrderBy("reviews");
    expect(result).toEqual([
      { reviewCount: "desc" },
      { avgRating: { sort: "desc", nulls: "last" } },
      { id: "asc" },
    ]);
  });

  it("returns id asc for default/unknown sort", () => {
    expect(buildOrderBy("")).toEqual([{ id: "asc" }]);
    expect(buildOrderBy("unknown")).toEqual([{ id: "asc" }]);
  });
});
