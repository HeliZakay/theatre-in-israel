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
}

export const GENRES: GenreInfo[] = [
  {
    slug: "drama",
    name: "דרמה",
    description:
      "הצגות דרמה מובילות על במות ישראל — סיפורים עמוקים, דמויות מורכבות ורגעות תיאטרליים שמשאירים חותם.",
  },
  {
    slug: "israeli",
    name: "ישראלי",
    description:
      "מיטב היצירה הישראלית המקורית — הצגות שנכתבו ונוצרו בישראל, המספרות את הסיפור הישראלי על כל גווניו.",
  },
  {
    slug: "touching",
    name: "מרגש",
    description:
      "הצגות מרגשות שנוגעות ללב — חוויות תיאטרליות עוצמתיות שמזמינות צחוק, דמעות והתרגשות.",
  },
  {
    slug: "comedy",
    name: "קומדיה",
    description:
      "הצגות קומדיה שמבטיחות צחוק — מקומדיות קלילות ועד סאטירות חדות, הבמה הישראלית יודעת להצחיק.",
  },
  {
    slug: "classic",
    name: "קלאסיקה",
    description:
      "יצירות קלאסיות על הבמה הישראלית — עיבודים מרהיבים למחזות שעמדו במבחן הזמן מהקאנון העולמי.",
  },
  {
    slug: "dramedy",
    name: "דרמה קומית",
    description:
      "דרמה קומית — הצגות שמשלבות עומק רגשי עם הומור, ויוצרות חוויה תיאטרלית עשירה ומפתיעה.",
  },
  {
    slug: "musical",
    name: "מוזיקלי",
    description:
      "הצגות מוזיקליות על הבמה הישראלית — מופעים שמשלבים משחק, שירה ומוזיקה חיה לחוויה שלמה.",
  },
  {
    slug: "muzical",
    name: "מחזמר",
    description:
      "מחזמרים על הבמה הישראלית — הפקות מרהיבות עם שירים, ריקודים ותפאורות מפוארות.",
  },
  {
    slug: "romantic",
    name: "רומנטי",
    description:
      "הצגות רומנטיות — סיפורי אהבה, יחסים וזוגיות על הבמה, מקומדיות רומנטיות ועד דרמות אהבה.",
  },
  {
    slug: "satire",
    name: "סאטירה",
    description:
      "סאטירה על הבמה — הצגות חדות שמאתגרות מוסכמות, מעלות חיוך ומזמינות חשיבה מחדש.",
  },
  {
    slug: "kids",
    name: "ילדים",
    description:
      "הצגות ילדים ומשפחה — הפקות צבעוניות, מרתקות ומבדרות לקהל הצעיר על במות התיאטרון בישראל.",
  },
  {
    slug: "fantasy",
    name: "פנטזיה",
    description:
      "הצגות פנטזיה — עולמות דמיוניים, קסם ויצירתיות על הבמה, חוויות תיאטרליות שפורצות גבולות.",
  },
  {
    slug: "dark-comedy",
    name: "קומדיה שחורה",
    description:
      "קומדיה שחורה על הבמה — הצגות שמצחיקות דרך האפלה, עם הומור חד ובלתי מתפשר.",
  },
  {
    slug: "thriller",
    name: "מותחן",
    description:
      "מותחנים על הבמה — הצגות מלאות מתח וסספנס שמחזיקות את הצופים על קצה הכיסא.",
  },
];

/** Map from URL slug → genre info */
export const GENRE_BY_SLUG = new Map(GENRES.map((g) => [g.slug, g]));

/** Map from Hebrew DB name → genre info */
export const GENRE_BY_NAME = new Map(GENRES.map((g) => [g.name, g]));
