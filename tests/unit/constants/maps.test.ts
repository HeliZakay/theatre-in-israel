import { GENRES, GENRE_BY_SLUG, GENRE_BY_NAME } from "@/constants/genres";
import { CITIES, CITY_BY_SLUG } from "@/constants/cities";
import {
  THEATRES,
  THEATRE_BY_SLUG,
  THEATRE_BY_NAME,
} from "@/constants/theatres";

/* ------------------------------------------------------------------ */
/*  Genres                                                             */
/* ------------------------------------------------------------------ */

describe("Genre maps", () => {
  it("GENRE_BY_SLUG has same size as GENRES (no duplicate slugs)", () => {
    expect(GENRE_BY_SLUG.size).toBe(GENRES.length);
  });

  it("GENRE_BY_NAME has same size as GENRES (no duplicate names)", () => {
    expect(GENRE_BY_NAME.size).toBe(GENRES.length);
  });

  it("every genre is findable by slug", () => {
    for (const genre of GENRES) {
      expect(GENRE_BY_SLUG.get(genre.slug)).toBe(genre);
    }
  });

  it("every genre is findable by name", () => {
    for (const genre of GENRES) {
      expect(GENRE_BY_NAME.get(genre.name)).toBe(genre);
    }
  });

  it("all slugs are lowercase with no spaces", () => {
    for (const genre of GENRES) {
      expect(genre.slug).toBe(genre.slug.toLowerCase());
      expect(genre.slug).not.toMatch(/\s/);
    }
  });
});

/* ------------------------------------------------------------------ */
/*  Cities                                                             */
/* ------------------------------------------------------------------ */

describe("City maps", () => {
  it("CITY_BY_SLUG has same size as CITIES (no duplicate slugs)", () => {
    expect(CITY_BY_SLUG.size).toBe(CITIES.length);
  });

  it("every city is findable by slug", () => {
    for (const city of CITIES) {
      expect(CITY_BY_SLUG.get(city.slug)).toBe(city);
    }
  });

  it("all slugs are lowercase with no spaces", () => {
    for (const city of CITIES) {
      expect(city.slug).toBe(city.slug.toLowerCase());
      expect(city.slug).not.toMatch(/\s/);
    }
  });

  it("every city has at least one alias", () => {
    for (const city of CITIES) {
      expect(city.aliases.length).toBeGreaterThan(0);
    }
  });
});

/* ------------------------------------------------------------------ */
/*  Theatres                                                           */
/* ------------------------------------------------------------------ */

describe("Theatre maps", () => {
  it("THEATRE_BY_SLUG has same size as THEATRES (no duplicate slugs)", () => {
    expect(THEATRE_BY_SLUG.size).toBe(THEATRES.length);
  });

  it("THEATRE_BY_NAME has same size as THEATRES (no duplicate names)", () => {
    expect(THEATRE_BY_NAME.size).toBe(THEATRES.length);
  });

  it("every theatre is findable by slug", () => {
    for (const theatre of THEATRES) {
      expect(THEATRE_BY_SLUG.get(theatre.slug)).toBe(theatre);
    }
  });

  it("every theatre is findable by name", () => {
    for (const theatre of THEATRES) {
      expect(THEATRE_BY_NAME.get(theatre.name)).toBe(theatre);
    }
  });

  it("all slugs are lowercase with no spaces", () => {
    for (const theatre of THEATRES) {
      expect(theatre.slug).toBe(theatre.slug.toLowerCase());
      expect(theatre.slug).not.toMatch(/\s/);
    }
  });
});
