# סיכום שינויים — שיפורי פרויקט

סקירה של כל השינויים שנעשו בקוד, מאורגנים לפי נושא.

---

## 1. אבטחה (Security)

### CSRF Middleware — `src/middleware.ts` (חדש)

מידלוור שבודק שכל בקשת POST/PATCH/PUT/DELETE ל-API מגיעה מאותו דומיין (Origin/Referer).
מונע התקפות cross-site request forgery.

### Security Headers — `next.config.mjs`

הוספת הדרים לכל התשובות מהשרת:

- `X-Content-Type-Options: nosniff` — מונע sniffing של סוגי קבצים
- `X-Frame-Options: DENY` — מונע הטמעה של האתר ב-iframe
- `Referrer-Policy: strict-origin-when-cross-origin` — שולח referrer רק באותו origin
- `Permissions-Policy` — חוסם גישה למצלמה, מיקרופון ומיקום
- `poweredByHeader: false` — מסתיר את הדר X-Powered-By

### Auth Secret בפרודקשן — `src/lib/auth.ts`

AUTH_SECRET חייב להיות מוגדר בפרודקשן, אחרת השרת זורק שגיאה (במקום לשתוק ולהשתמש בערך ריק).

### callbackUrl Validation — `src/app/auth/signin/page.tsx`

פונקציה `isValidCallbackUrl` שמוודאת ש-callbackUrl מתחיל ב-`/` ולא ב-`//` (protocol-relative URL).
מונע redirect attacks לאתרים חיצוניים.

### callbackUrl Validation במובייל — `src/components/Header/MobileMenu.tsx`

אותו validation גם בכפתור ההתחברות בתפריט המובייל.

### Query Length Cap — `src/utils/showsQuery.ts`

חיפוש טקסט מוגבל ל-200 תווים מקסימום, כדי למנוע שאילתות DB כבדות מדי.

### Rate Limit לעריכה/מחיקה — `src/utils/reviewRateLimit.ts`

הוספת `checkEditDeleteRateLimit()` — מקסימום 10 עריכות/מחיקות בשעה לכל משתמש.

---

## 2. ארכיטקטורה — פיצול שכבת הנתונים (Data Layer)

### תיקיית `src/lib/data/` (חדשה)

הקובץ הגדול `showsData.ts` (~330 שורות) פוצל ל-3 קבצים ממוקדים:

- **`homepage.ts`** — כל מה שקשור לדף הבית (suggestions, top rated, סקציות ז׳אנרים)
- **`showsList.ts`** — רשימת הצגות עם סינון, מיון ופגינציה
- **`showDetail.ts`** — שליפת הצגה בודדת לפי ID

### `src/lib/data/index.ts` (חדש)

Barrel file לייצוא נוח מכל קבצי ה-data.

### `src/lib/showsData.ts` (עודכן)

הפך לקובץ `@deprecated` שמפנה לקבצים החדשים — כך קוד ישן שמייבא משם ימשיך לעבוד.

### `src/lib/showHelpers.ts` (חדש)

פונקציית `normalizeShow()` ו-`showInclude` הועברו לקובץ משותף.
`normalizeShow` עכשיו מקבלת טיפוס `Prisma.ShowGetPayload` במקום `Record<string, unknown>` — בלי castים מיותרים.

### `src/lib/shows.ts` (עודכן)

- הוסרה `getShows()` שכבר לא הייתה בשימוש
- הוספה `getShowOptions()` — שולפת רק `id` ו-`title` לטפסי בחירה (קלה בהרבה)
- `addReview()` פושטה: מקבלת `number` showId ומחזירה `Review` בלבד (במקום לעשות 3 שאילתות)
- הוסרו ייצואים מיותרים (`getAverageRating`, `getLatestReviewDate`)

---

## 3. שיפורי ביצועים (Caching & Performance)

### ISR (Incremental Static Regeneration)

- **דף הבית** (`src/app/page.tsx`): שונה מ-`force-dynamic` ל-`revalidate = 120` (מתרענן כל 2 דקות)
- **דף הצגה** (`src/app/shows/[id]/page.tsx`): אותו דבר — `revalidate = 120`
- דפים שדורשים auth נשארו `force-dynamic` עם הערה שמסבירה למה

### Promise.allSettled בדף הבית — `src/lib/data/homepage.ts`

כל 6 השאילתות של דף הבית רצות במקביל עם `Promise.allSettled`.
אם סקציה אחת נכשלת (למשל "מוזיקלים"), שאר הדף עדיין נטען.

### DB-Level Sort + Limit — `src/lib/data/homepage.ts`

`getShowsByGenres()` עכשיו עושה sort ו-limit ברמת ה-SQL (במקום לשלוף הכל ולמיין ב-JS).

### SQL Injection Protection — `src/lib/data/showsList.ts`

`getFilteredSortedIds()` עובר מ-`$queryRawUnsafe` ל-`$queryRaw` עם tagged template literal.

---

## 4. מודולריות — Header

### פיצול `Header.tsx` (~300 שורות → ~100)

Header הגדול פוצל ל-3 קומפוננטות:

- **`DesktopNav.tsx`** (חדש) — ניווט דסקטופ עם Radix NavigationMenu
- **`MobileMenu.tsx`** (חדש) — תפריט מובייל + כפתורי auth + backdrop
- **`AccountDropdown.tsx`** (חדש) — תפריט חשבון (dropdown) עם logout

### `src/hooks/useHeaderOffset.ts` (חדש)

לוגיקת ResizeObserver שמעדכנת את `--header-offset` הועברה מ-Header ל-hook עצמאי.

### `src/hooks/useMediaQuery.ts` (חדש)

Hook ל-breakpoint detection (SSR-safe) עם `useSyncExternalStore`.

---

## 5. מודולריות — טפסי ביקורת

### `src/components/ReviewFormFields/` (חדש)

קומפוננטה משותפת לשדות כותרת + דירוג + טקסט.
משמשת גם ב-`ReviewForm` (יצירה) וגם ב-`EditReviewForm` (עריכה).
מבטלת שכפול קוד בין שני הטפסים.

### `src/constants/reviewSchemas.ts` (חדש)

Zod schemas מרוכזים:

- `createReviewSchema` — ל-API POST (כולל showId כ-`z.coerce.number()`)
- `updateReviewSchema` — ל-API PATCH
- `clientReviewSchema` — לצד לקוח (showId כ-string)
- `clientEditReviewSchema` — לטופס עריכה
- `ratingOptions` — אפשרויות דירוג לתפריט נפתח
- `formatZodErrors()` — הודעות שגיאה ללא field paths (בטוח יותר)

### `src/components/ReviewForm/ReviewForm.module.css` (חדש)

סגנונות הטופס הועברו מ-`reviews/new/page.module.css` — שכפול הוסר מהעמוד.

---

## 6. שכפול auth pattern — `requireAuth()`

### `src/lib/auth.ts` — הוספת `requireAuth(callbackUrl)`

פונקציה שמרכזת את לוגיקת "אם לא מחובר, redirect לדף התחברות":

**לפני:**

```ts
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  redirect(`${ROUTES.AUTH_SIGNIN}?callbackUrl=...&reason=auth_required`);
}
```

**אחרי:**

```ts
const session = await requireAuth(ROUTES.MY_REVIEWS);
```

הוחלף ב-4 דפים:

- `src/app/reviews/new/page.tsx`
- `src/app/me/reviews/page.tsx`
- `src/app/me/reviews/[id]/edit/page.tsx`
- `src/app/shows/[id]/review/page.tsx`

---

## 7. API Routes — תשובות אחידות

### `src/utils/apiResponse.ts` (חדש)

פונקציות `apiError()`, `apiSuccess()`, וקבוע `INTERNAL_ERROR_MESSAGE`.

### שלושת ה-API routes עודכנו:

- **`src/app/api/reviews/route.ts`** — POST ליצירת ביקורת
- **`src/app/api/reviews/[id]/route.ts`** — PATCH/DELETE לעריכה/מחיקה
- **`src/app/api/me/reviews/route.ts`** — GET לביקורות של המשתמש

שינויים עיקריים:

- `NextResponse.json(...)` → `apiError(...)` / `apiSuccess(...)`
- הודעות שגיאה באנגלית → עברית
- שגיאות 500 מוסתרות מהמשתמש (מודפסות רק ל-console)
- הוספת rate limit לעריכה/מחיקה
- `comment` → `text` (שם אחיד)

---

## 8. שינוי שם שדה: comment → text

בכל הקוד, השדה `comment` שונה ל-`text` כדי להתאים לסכמת ה-DB:

- `reviewValidation.ts`: `REVIEW_COMMENT_*` → `REVIEW_TEXT_*`
- `EditReviewForm.tsx`: `initialComment` → `initialText`
- `ReviewForm.tsx`: שדה `comment` → `text`
- API routes: `comment` → `text`

---

## 9. Error Boundaries ו-Loading States

### `src/app/error.tsx` (עודכן)

- עבר מ-inline styles ל-CSS Modules
- הודעת שגיאה מפורטת רק ב-development
- כפתורי "נסה שוב" ו"חזור לדף הבית" עם עיצוב נקי

### `src/app/error.module.css` (חדש)

סגנונות לדף השגיאה.

### `src/app/global-error.tsx` (חדש)

Error boundary ברמת ה-layout — תופס שגיאות שקורות מחוץ לדפים (בשלד html/body).

### `src/app/not-found.tsx` (חדש/עודכן)

דף 404 עם CSS Modules במקום inline styles.

### `src/app/not-found.module.css` (חדש)

סגנונות לדף ה-404.

### `src/app/me/reviews/[id]/edit/loading.tsx` (חדש)

Loading skeleton לדף עריכת ביקורת — מופיע בזמן שה-server component נטען.

---

## 10. Type Safety ושיפורי קוד

### `src/components/Button/Button.tsx`

`[key: string]: unknown` הוחלף ב-`onClick` ו-`aria-label` מוגדרים — type-safe.

### `src/components/Card/Card.tsx`

`[key: string]: unknown` הוחלף ב-`extends React.HTMLAttributes<HTMLElement>` — תומך בכל ה-HTML attributes.

### `src/components/ReviewCard/ReviewCard.tsx`

- הוסר `"use client"` — הפך ל-server component
- "קרא עוד/פחות" עובד עכשיו עם `<details>/<summary>` (HTML בלבד, בלי JS)
- מבטל double-rendering (SSR + hydration)

### `src/hooks/useCombobox.ts`

`queueActiveIndexUpdate` עטוף ב-`useCallback` כדי לתקן dependency של `useEffect`.

---

## 11. שיפורי UX

### `src/components/Pagination/Pagination.tsx`

- הוספת ellipsis (...) בין עמודים רחוקים
- `aria-label` בעברית: "ניווט עמודים" במקום "Pagination"

### `src/app/shows/ShowsContent.tsx`

מציג `filters.total` (מספר אמיתי של תוצאות) במקום `shows.length` (רק העמוד הנוכחי).

### `src/components/Hero/Hero.tsx`

אם אין הצגה מובילה, הסקציה לא מופיעה בכלל (במקום fallback hardcoded).

---

## 12. ניקוי קוד

### `src/lib/fonts.ts` (חדש)

Instance אחד של `Frank_Ruhl_Libre` — במקום שכפול ב-Logo.tsx וב-Footer.tsx.

### `src/components/Footer/Footer.tsx` ו-`Logo.tsx`

מייבאים `titleFont` מ-`@/lib/fonts` במקום להגדיר אותו מחדש.

### `src/utils/profanityFilter.ts`

הוסרו `cleanProfanity()` ו-`listProfanity()` — פונקציות שלא היו בשימוש.

### `src/utils/reviewRateLimit.ts`

הוסרה `hasExistingReview()` — הלוגיקה מטופלת ברמת ה-DB (unique constraint).

### `src/components/index.ts`

- הוספת ייצוא `ReviewFormFields`
- הוסר ייצוא של `ROUTES` (לא שייך לקומפוננטות)

### `src/lib/prisma.ts`

DATABASE_URL check הועבר לתחילת הקובץ (module-level), עם skip בזמן build.

---

## 13. קבצים חדשים (רשימה מלאה)

| קובץ                                                          | תיאור                       |
| ------------------------------------------------------------- | --------------------------- |
| `src/middleware.ts`                                           | CSRF protection             |
| `src/lib/data/homepage.ts`                                    | נתוני דף הבית               |
| `src/lib/data/showsList.ts`                                   | רשימת הצגות + סינון         |
| `src/lib/data/showDetail.ts`                                  | הצגה בודדת                  |
| `src/lib/data/index.ts`                                       | Barrel file                 |
| `src/lib/showHelpers.ts`                                      | normalizeShow + showInclude |
| `src/lib/fonts.ts`                                            | Frank Ruhl Libre instance   |
| `src/constants/reviewSchemas.ts`                              | Zod schemas מרוכזים         |
| `src/utils/apiResponse.ts`                                    | API response helpers        |
| `src/hooks/useHeaderOffset.ts`                                | ResizeObserver hook         |
| `src/hooks/useMediaQuery.ts`                                  | Breakpoint detection hook   |
| `src/components/Header/DesktopNav.tsx`                        | ניווט דסקטופ                |
| `src/components/Header/MobileMenu.tsx`                        | תפריט מובייל                |
| `src/components/Header/AccountDropdown.tsx`                   | תפריט חשבון                 |
| `src/components/ReviewFormFields/ReviewFormFields.tsx`        | שדות טופס משותפים           |
| `src/components/ReviewFormFields/ReviewFormFields.module.css` | סגנונות שדות                |
| `src/components/ReviewForm/ReviewForm.module.css`             | סגנונות טופס ביקורת         |
| `src/app/error.module.css`                                    | סגנונות דף שגיאה            |
| `src/app/not-found.tsx`                                       | דף 404                      |
| `src/app/not-found.module.css`                                | סגנונות 404                 |
| `src/app/global-error.tsx`                                    | Error boundary ברמת layout  |
| `src/app/me/reviews/[id]/edit/loading.tsx`                    | Loading skeleton            |
