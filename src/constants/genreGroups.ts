export interface GenreSection {
  genres: readonly string[];
  kicker: string;
  title: string;
  linkText: string;
}

export const GENRE_SECTIONS = {
  dramas: {
    genres: ["דרמה"],
    kicker: "ז'אנר",
    title: "דרמות",
    linkText: "לכל הדרמות",
  },
  comedies: {
    genres: ["קומדיה"],
    kicker: "ז'אנר",
    title: "קומדיות",
    linkText: "לכל הקומדיות",
  },
  musicals: {
    genres: ["מחזמר"],
    kicker: "ז'אנר",
    title: "מחזמרים",
    linkText: "לכל מחזות הזמר",
  },
  israeli: {
    genres: ["ישראלי"],
    kicker: "ז'אנר",
    title: "ישראלי",
    linkText: "לכל הישראליים",
  },
} as const satisfies Record<string, GenreSection>;
