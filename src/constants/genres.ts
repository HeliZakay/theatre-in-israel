/**
 * Genre slug ↔ display-name mapping.
 * Slugs are Latin for clean URLs; display names are Hebrew (matching Genre.name in DB).
 * Only genres with 10+ shows get dedicated pages.
 */

export interface GenreInfo {
  /** URL slug (Latin) */
  slug: string;
  /** Hebrew display name (matches Genre.name in DB) */
  name: string;
  /** Short Hebrew description for SEO */
  description: string;
  /** Hero image path in /public */
  image: string;
}

export const GENRES: GenreInfo[] = [
  {
    slug: "drama",
    name: "דרמה",
    description:
      "הצגות דרמה מובילות על במות ישראל — סיפורים עמוקים, דמויות מורכבות ורגעות תיאטרליים שמשאירים חותם.",
    image: "/דרמה.webp",
  },
  {
    slug: "israeli",
    name: "ישראלי",
    description:
      "מיטב היצירה הישראלית המקורית — הצגות שנכתבו ונוצרו בישראל, המספרות את הסיפור הישראלי על כל גווניו.",
    image: "/ישראלי.webp",
  },
  {
    slug: "touching",
    name: "מרגש",
    description:
      "הצגות מרגשות שנוגעות ללב — חוויות תיאטרליות עוצמתיות שמזמינות צחוק, דמעות והתרגשות.",
    image: "/מרגש.webp",
  },
  {
    slug: "comedy",
    name: "קומדיה",
    description:
      "הצגות קומדיה שמבטיחות צחוק — מקומדיות קלילות ועד סאטירות חדות, הבמה הישראלית יודעת להצחיק.",
    image: "/קומדיה.webp",
  },
  {
    slug: "classic",
    name: "קלאסיקה",
    description:
      "יצירות קלאסיות על הבמה הישראלית — עיבודים מרהיבים למחזות שעמדו במבחן הזמן מהקאנון העולמי.",
    image: "/קלאסיקה.webp",
  },
  {
    slug: "dramedy",
    name: "דרמה קומית",
    description:
      "דרמה קומית — הצגות שמשלבות עומק רגשי עם הומור, ויוצרות חוויה תיאטרלית עשירה ומפתיעה.",
    image: "/דרמה-קומית.webp",
  },
  {
    slug: "musical",
    name: "מוזיקלי",
    description:
      "הצגות מוזיקליות על הבמה הישראלית — מופעים שמשלבים משחק, שירה ומוזיקה חיה לחוויה שלמה.",
    image: "/מוזיקלי.webp",
  },
  {
    slug: "muzical",
    name: "מחזמר",
    description:
      "מחזמרים על הבמה הישראלית — הפקות מרהיבות עם שירים, ריקודים ותפאורות מפוארות.",
    image: "/מחזמר.webp",
  },
  {
    slug: "romantic",
    name: "רומנטי",
    description:
      "הצגות רומנטיות — סיפורי אהבה, יחסים וזוגיות על הבמה, מקומדיות רומנטיות ועד דרמות אהבה.",
    image: "/רומנטי.webp",
  },
  {
    slug: "satire",
    name: "סאטירה",
    description:
      "סאטירה על הבמה — הצגות חדות שמאתגרות מוסכמות, מעלות חיוך ומזמינות חשיבה מחדש.",
    image: "/סאטירה.webp",
  },
  {
    slug: "kids",
    name: "ילדים",
    description:
      "הצגות ילדים ומשפחה — הפקות צבעוניות, מרתקות ומבדרות לקהל הצעיר על במות התיאטרון בישראל.",
    image: "/ילדים.webp",
  },
  {
    slug: "fantasy",
    name: "פנטזיה",
    description:
      "הצגות פנטזיה — עולמות דמיוניים, קסם ויצירתיות על הבמה, חוויות תיאטרליות שפורצות גבולות.",
    image: "/פנטזיה.webp",
  },
  {
    slug: "dark-comedy",
    name: "קומדיה שחורה",
    description:
      "קומדיה שחורה על הבמה — הצגות שמצחיקות דרך האפלה, עם הומור חד ובלתי מתפשר.",
    image: "/קומדיה-שחורה.webp",
  },
  {
    slug: "thriller",
    name: "מותחן",
    description:
      "מותחנים על הבמה — הצגות מלאות מתח וסספנס שמחזיקות את הצופים על קצה הכיסא.",
    image: "/מותחן.webp",
  },
];

/** Map from URL slug → genre info */
export const GENRE_BY_SLUG = new Map(GENRES.map((g) => [g.slug, g]));

/** Map from Hebrew DB name → genre info */
export const GENRE_BY_NAME = new Map(GENRES.map((g) => [g.name, g]));
