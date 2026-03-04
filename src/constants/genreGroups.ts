export interface GenreSection {
  genres: readonly string[];
  kicker: string;
  title: string;
  linkText: string;
}

export const GENRE_SECTIONS = {
  dramas: {
    genres: ["דרמה", "דרמה קומית"],
    kicker: "ז'אנר",
    title: "דרמות",
    linkText: "לכל הדרמות",
  },
  comedies: {
    genres: ["קומדיה", "קומדיה שחורה", "סאטירה"],
    kicker: "ז'אנר",
    title: "קומדיות",
    linkText: "לכל הקומדיות",
  },
  musicals: {
    genres: ["מוזיקלי", "מחזמר"],
    kicker: "ז'אנר",
    title: "מוזיקלי",
    linkText: "לכל המוזיקליים",
  },
  israeli: {
    genres: ["ישראלי"],
    kicker: "ז'אנר",
    title: "הכי ישראלי",
    linkText: "לכל הישראליים",
  },
} as const satisfies Record<string, GenreSection>;
