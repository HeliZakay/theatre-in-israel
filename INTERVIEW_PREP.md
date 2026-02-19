<div dir="rtl">

# הכנה לראיון — פרויקט "תיאטרון בישראל"

---

# חלק א׳: הסבר מעמיק

---

## 1. ארכיטקטורה — למה App Router ואיך הפרויקט בנוי

### הבחירה ב-Next.js App Router (גרסה 16)

הפרויקט משתמש ב-**App Router** של Next.js ולא ב-Pages Router הישן. ההבדל המרכזי: ב-App Router, כל קומפוננטה היא **Server Component** כברירת מחדל. זה אומר שהקוד רץ בצד השרת בלבד ולא נשלח לדפדפן כ-JavaScript.

**למה זה חשוב:**

- **פחות JavaScript ללקוח** — קומפוננטות שרת לא מוסיפות לbundle. בפרויקט הזה, רוב הקומפוננטות (16 מתוך 28) הן Server Components — כמו `ShowCard`, `ReviewCard`, `Card`, `Pagination`, `Footer`, `Hero`
- **גישה ישירה לDB** — אפשר לעשות `await prisma.show.findMany()` ישירות בתוך קומפוננטה, בלי ליצור API endpoint. הדפים `src/app/page.tsx`, `src/app/shows/[id]/page.tsx` עושים בדיוק את זה
- **SEO מובנה** — כל ה-HTML מגיע מוכן מהשרת, כולל metadata ו-JSON-LD

**מתי בכל זאת צריך Client Component:**
קומפוננטות שמשתמשות ב-`useState`, `useEffect`, event handlers, או hooks של דפדפן חייבות להיות מסומנות ב-`"use client"`. בפרויקט — אלה בעיקר:

- **`Header`** — תפריט ניווט עם mobile menu ו-dropdown
- **`ShowsFilterBar`** — פילטרים שמשנים URL params
- **`ReviewForm`** — טופס עם React Hook Form
- **`WatchlistButton`** — toggle עם state אופטימיסטי
- **`ShowCarousel`** — קרוסלה עם Embla

### ארכיטקטורת שלוש שכבות

הפרויקט בנוי בשכבות ברורות:

```
דפים (src/app/)  →  שכבת נתונים (src/lib/data/)  →  Prisma (src/lib/prisma.ts)
```

**שכבה 1 — דפים** (`src/app/`): אחראים על layout, metadata, ו-UI. קוראים לפונקציות מהשכבה השנייה.

**שכבה 2 — שכבת נתונים** (`src/lib/data/`): שלושה קבצים מפוצלים לפי תחום:

- `homepage.ts` — 6 שאילתות מקבילות לעמוד הבית (featured, top-rated, דרמות, קומדיות וכו׳)
- `showsList.ts` — רשימת הצגות עם פילטרים, מיון ופאגינציה
- `showDetail.ts` — הצגה בודדת לפי ID

**שכבה 3 — Prisma**: Client יחיד (singleton) שמאוחסן על `globalThis` כדי למנוע יצירת connections מיותרים ב-development.

**למה הפיצול הזה חשוב:** לפני הריפקטור, היה קובץ אחד (`showsData.ts`) שטיפל בהכל. הפיצול מאפשר:

- כל קובץ אחראי על use case אחד
- קל יותר לתחזק ולבדוק
- אפשר להגדיר `revalidate` שונה לכל use case

### אסטרטגיות Data Fetching

הפרויקט משתמש בשלוש אסטרטגיות:

1. **ISR (Incremental Static Regeneration)** — `revalidate = 120` (כל 2 דקות). משמש בעמוד הבית ובדפי הצגה בודדת. הדף נבנה פעם אחת, מוגש כ-static, ומתרענן ברקע כל 120 שניות. **יתרון:** מהירות טעינה. **חיסרון:** תוכן לא מתעדכן מיידית.

2. **`force-dynamic`** — משמש בדפים שתלויים בsession (כמו "הביקורות שלי", "רשימת הצפייה") או בquery params (דף הצגות עם חיפוש). **יתרון:** תוכן תמיד עדכני. **חיסרון:** כל בקשה הולכת לשרת.

3. **`React.cache()`** — Deduplication. בדף הצגה בודדת (`src/app/shows/[id]/page.tsx`), גם `generateMetadata` וגם הדף עצמו קוראים ל-`getShowById()`. בזכות `cache()`, השאילתה רצה רק פעם אחת בכל request.

### `Promise.allSettled` בעמוד הבית

ב-`homepage.ts`, 6 שאילתות רצות **במקביל** עם `Promise.allSettled`. זה שונה מ-`Promise.all`:

- **`Promise.all`** — אם שאילתה אחת נכשלת, הכל נכשל
- **`Promise.allSettled`** — כל שאילתה עצמאית. אם "הצגות קומדיה" נכשלת, שאר הסקציות עדיין יוצגו

זו **degradation חיננית** — המשתמש מקבל חוויה חלקית במקום דף שגיאה מלא.

---

## 2. Design System ו-CSS

### גישת CSS Modules עם Design Tokens

הפרויקט **לא** משתמש ב-Tailwind או CSS-in-JS. במקום זאת:

**CSS Modules** — כל קומפוננטה מגיעה עם קובץ `.module.css` צמוד. **למה:**

- **Scoping אוטומטי** — שמות classes עוברים hashing (למשל `.card` הופך ל-`.card_abc123`), אז אין התנגשויות
- **אפס runtime** — הCSS מעובד בזמן build, לא צריך JavaScript לייצר styles
- **קל למחוק** — מוחקים קומפוננטה? ה-CSS נמחק איתה. אין dead CSS

**למה לא Tailwind** (שאלה שכנראה ישאלו):

- **יתרונות Tailwind:** מהירות פיתוח, consistency, לא צריך לחשוב על שמות classes
- **חסרונות Tailwind:** HTML מלא בclasses ארוכים (`className="flex items-center justify-between px-4 py-2 bg-white rounded-lg shadow-md"`), קשה יותר לקרוא, תלות ב-framework ספציפי
- **למה CSS Modules כאן:** הפרויקט מדגיש קריאות, שליטה מלאה על ה-CSS, וזירו-runtime-cost. לפרויקט בגודל הזה (~28 קומפוננטות) זה סביר. לפרויקט גדול יותר עם צוות — Tailwind עשוי להיות עדיף ל-consistency

### מערכת Tokens

ב-`src/app/tokens.css` מוגדרים ~40 CSS custom properties (משתנים):

```css
--color-curtain-red: #9c1b20; /* צבע מוטיב — וילון תיאטרון */
--color-curtain-red-10: rgba(156, 27, 32, 0.1); /* 8 גוונים באלפא שונה */
--color-text-primary: #111;
--color-text-muted: rgba(0, 0, 0, 0.65);
--radius-sm: 12px;
--radius-pill: 999px;
--card-bg: rgba(255, 255, 255, 0.75);
```

**למה tokens ולא ערכים hardcoded:**

- **עקביות** — אותו אדום בכל מקום, אותו radius
- **שינוי קל** — משנים ב-tokens.css ומשתנה בכל האתר
- **Dark mode עתידי** — מחליפים tokens ב-media query

בריפקטור הוחלפו **65 ערכים hardcoded** ב-12 קבצי CSS.

### הפונקציה `cx()`

ב-`src/utils/cx.ts` יש utility פשוט לחיבור שמות CSS classes:

```typescript
cx("card", isActive && "active", hasError && "error");
// → "card active" (אם isActive=true, hasError=false)
```

לפני הריפקטור, 8 קומפוננטות שונות כתבו את הלוגיקה הזו בעצמן. עכשיו יש מקום אחד.

### RTL מובנה

האפליקציה בנויה RTL מהיסוד:

- `<html lang="he" dir="rtl">` — בroot layout
- `RadixDirectionProvider` — עוטף לRadix UI
- קרוסלת Embla מוגדרת עם `direction: "rtl"`
- כל הטקסט בעברית

---

## 3. עיצוב מסד הנתונים — Prisma ו-PostgreSQL

### הסכמה (Schema)

7 טבלאות, הקשרים ביניהן:

```
User ──┬── Account (OAuth providers)
       ├── Session
       ├── Review ──────── Show ──┬── ShowGenre ──── Genre
       ├── Watchlist ──── Show    │
       └── VerificationToken      └── Review
```

**החלטות עיצוב מרכזיות:**

**1. Many-to-Many עם Join Table (לא מערך)**
ז׳אנרים מחוברים להצגות דרך טבלת `ShowGenre`, לא דרך עמודת array:

- **יתרון:** אפשר לסנן בSQL (`WHERE genre.name = 'דרמה'`), אינדוקסים, referential integrity
- **חיסרון:** JOIN נוסף בשאילתות
- **אלטרנטיבה שנדחתה:** שדה `genres String[]` ב-PostgreSQL — מהיר יותר לכתיבה אבל קשה לסנן ואי אפשר לוודא שהערכים תקינים

**2. Unique constraint על ביקורת**
`@@unique([userId, showId])` על טבלת `Review` — משתמש יכול לכתוב רק ביקורת אחת להצגה. זה נאכף **ברמת ה-DB**, לא רק באפליקציה. אם שתי בקשות מגיעות במקביל — אחת תיכשל עם שגיאת Prisma `P2002`.

**3. Soft Delete על ביקורות**
`Review.userId` מוגדר עם `onDelete: SetNull`. אם משתמש נמחק, הביקורות שלו **נשארות** — רק ה-userId הופך ל-null. שם המחבר שמור בשדה `Review.author` (denormalization).

**למה:** ביקורות הן תוכן בעל ערך. אם משתמש מוחק חשבון, הביקורות עדיין מועילות למשתמשים אחרים.

**4. Composite Primary Key ב-Watchlist**
`@@id([userId, showId])` — אין צורך בעמודת ID נפרדת. השילוב של userId + showId הוא ייחודי מטבעו, וזה מונע כפילויות ברמת ה-DB.

**5. CUIDs לUsers, Auto-increment לShowים**

- Users מקבלים CUID (מחרוזת אקראית כמו `clx2abc...`) — בטוח יותר ב-URLs, לא ניתן לנחש
- Shows/Reviews/Genres מקבלים auto-increment integer — פשוט יותר, מספיק כי אלה לא מידע רגיש

### היסטוריית מיגרציות

5 מיגרציות ב-5 ימים — מראה התפתחות הסכמה:

| תאריך | מה קרה                                                                     |
| ----- | -------------------------------------------------------------------------- |
| 11.2  | סכמה ראשונית: Show, Genre, ShowGenre, Review                               |
| 12.2  | הוספת User + אימות (Account, Session, VerificationToken) + userId ב-Review |
| 13.2  | Unique constraint על userId+showId (אחרי שהבנו שצריך לאכוף את זה)          |
| 14.2  | הוספת שדה password ל-User (הוספת Credentials auth)                         |
| 15.2  | טבלת Watchlist                                                             |

זה מראה גישה **אינקרמנטלית** לפיתוח — התחלנו עם הליבה, הוספנו פיצ׳רים בהדרגה.

---

## 4. אימות ואבטחה

### אימות עם NextAuth.js v4

**שני providers:**

- **Google OAuth** — כפתור בולט בUI. משתמש לוחץ → מועבר לגוגל → חוזר עם token
- **Credentials** — אימייל + סיסמה. הסיסמה עוברת hashing עם `bcryptjs` (10 rounds) לפני שמירה ב-DB

**אסטרטגיית JWT:**

- הsession מאוחסן כ-JWT token ב-cookie, לא ב-DB
- **יתרון:** לא צריך לפנות ל-DB בכל request כדי לבדוק session
- **חיסרון:** אי אפשר לבטל session ספציפי מהשרת (צריך לחכות שפג תוקף — 30 יום)
- **`PrismaAdapter`** — אחראי רק על שמירת accounts ו-users ב-DB, לא sessions

**Helper functions:**

- `requireAuth(callbackUrl)` — בצד שרת. אם המשתמש לא מחובר, מעביר לlogin עם callback URL (כדי לחזור לדף אחרי login)
- `requireApiAuth()` — ב-API routes. מחזיר `AuthenticatedSession` או response 401

### שכבות אבטחה

**1. הגנת CSRF** (`src/middleware.ts`)

- בכל בקשת API שמשנה נתונים (POST, PATCH, DELETE), ה-middleware בודק שה-`Origin` או `Referer` header מתאים ל-`Host`
- **למה:** מונע מאתר זדוני לשלוח בקשות בשם המשתמש (Cross-Site Request Forgery)
- **למה ב-middleware ולא ב-API:** כי זה צריך לרוץ **לפני** כל ה-API logic

**2. Security Headers** (`next.config.mjs`)

- `X-Content-Type-Options: nosniff` — מונע מהדפדפן "לנחש" סוג תוכן
- `X-Frame-Options: DENY` — מונע הטמעה ב-iframe (clickjacking)
- `Referrer-Policy: strict-origin-when-cross-origin` — מגביל מידע שנשלח ב-Referer header
- `poweredByHeader: false` — מסתיר את `X-Powered-By: Next.js` (אין סיבה לחשוף stack)

**3. Rate Limiting**
שתי אסטרטגיות שונות:

- **יצירת ביקורת:** 3 לשעה למשתמש — **מבוסס DB** (שואל כמה ביקורות נוצרו בשעה האחרונה). **יתרון:** עמיד ב-restart, מדויק. **חיסרון:** שאילתת DB נוספת
- **עריכה/מחיקה:** 10 לשעה — **מבוסס זיכרון** (sliding window ב-Map). **יתרון:** מהיר, לא מצריך DB. **חיסרון:** מתאפס ב-restart, לא עובד עם מספר instances

**4. סינון תוכן פוגעני**

- ספריית `leo-profanity` עם רשימות מילים באנגלית ועברית
- בודק כותרת, טקסט, ושם מחבר בביקורות
- **למה:** פלטפורמה ציבורית שמציגה תוכן משתמשים — חייבים למנוע תוכן פוגעני

**5. הגנת Open Redirect**

- `isValidCallbackUrl()` ב-`src/utils/auth.ts` — מוודא שה-callback URL מתחיל ב-`/` ולא ב-`//`
- **למה:** אם callback URL היה `//evil.com`, הדפדפן היה מעביר לאתר זדוני אחרי login

**6. SQL Injection Prevention**

- Prisma's `$queryRaw` עם tagged templates (לא `$queryRawUnsafe`) — הערכים עוברים escaping אוטומטי

---

## 5. ביצועים (Performance)

### ISR — Incremental Static Regeneration

עמוד הבית ודפי הצגה מוגדרים עם `revalidate = 120`:

- **Request ראשון:** Next.js בונה את ה-HTML ומשמר (cache)
- **120 שניות הבאות:** כל בקשה מקבלת את ה-cached HTML מיד
- **אחרי 120 שניות:** הבקשה הבאה עדיין מקבלת cache ישן, אבל ברקע Next.js בונה גרסה חדשה
- **Trade-off:** ביקורת חדשה לא תופיע מיד (עד 2 דקות delay). לאתר תוכן זה קביל; לאתר מסחר אלקטרוני — אולי לא

### Prisma Singleton

ב-`src/lib/prisma.ts`, ה-Prisma Client מאוחסן על `globalThis`:

```
globalThis.prisma = globalThis.prisma || new PrismaClient()
```

**למה:** ב-development, Next.js עושה hot reload ומרענן מודולים. בלי singleton, כל refresh יוצר Prisma Client חדש ← connection חדש ל-DB ← דליפת connections עד שהDB מסרב

### Neon Serverless Adapter

הפרויקט מזהה אוטומטית אם ה-DB URL הוא של Neon:

- **Neon:** משתמש ב-WebSocket adapter (מותאם ל-serverless — ללא TCP connection מתמשך)
- **PostgreSQL רגיל:** חיבור ישיר
- **למה:** Vercel serverless functions חיות לזמן קצר. חיבור TCP רגיל יהיה איטי (TLS handshake כל פעם). ה-WebSocket adapter של Neon פותר את זה

### Optimistic UI עם React 19

`ShowsFilterBar` משתמש ב-`useOptimistic`:

- כשמשתמש לוחץ על פילטר, ה-URL params מתעדכנים **מיד** ב-UI
- ברקע, `useTransition` מריץ ניווט ל-URL החדש (שאילתות DB)
- אם הניווט נכשל, ה-state יחזור לערך האמיתי

**`useTransition`** — מסמן את הניווט כ"לא דחוף", כך ש-React לא חוסם את ה-UI בזמן שהשרת עובד

### `react.cache()` — Deduplication

בדף הצגה בודדת, הפונקציה `getShowById` עטופה ב-`cache()`. שני קוראים (metadata + page) מקבלים את אותה תוצאה בלי שתי שאילתות DB.

### Font Optimization

- `next/font/google` — הפונטים יורדים בזמן build ומאורחים locally (לא תלוי ב-Google CDN)
- `display: "swap"` — טקסט מוצג מיד עם font fallback, מתחלף כשהפונט נטען
- shared instance ב-`src/lib/fonts.ts` — Frank Ruhl Libre נטען פעם אחת ומשותף בין קומפוננטות

---

# חלק ב׳: שאלות ותשובות צפויות

---

### ש: ספר/י על הפרויקט בקצרה

> **ת:** "תיאטרון בישראל" היא פלטפורמה לגילוש וביקורת על הצגות תיאטרון. המשתמשים יכולים לחפש הצגות, לסנן לפי ז׳אנר ותיאטרון, לקרוא ולכתוב ביקורות, ולנהל רשימת צפייה אישית. הפרויקט בנוי עם Next.js 16 (App Router), Prisma עם PostgreSQL, ו-NextAuth לאימות. כל ה-UI בעברית ובכיוון RTL.

---

### ש: למה בחרת ב-App Router ולא ב-Pages Router?

> **ת:** App Router מאפשר Server Components כברירת מחדל, מה שמקטין את ה-JavaScript bundle כי רוב הקומפוננטות לא נשלחות לדפדפן. בפרויקט הזה, 16 מתוך 28 קומפוננטות הן Server Components. בנוסף, App Router נותן layouts מקוננים, streaming, ו-React 19 features כמו `useOptimistic`. כיוון שזה פרויקט חדש, לא הייתה סיבה לעבוד עם ה-API הישן.

---

### ש: איך החלטת מה יהיה Server Component ומה Client?

> **ת:** כלל האצבע: Client רק כשחייבים. כל דבר שצריך `useState`, `useEffect`, event handlers, או browser APIs — הוא Client. כל השאר — Server. למשל, `ReviewCard` התחיל כ-Client Component עם state ל-toggle, אבל בריפקטור הוא הומר ל-Server Component שמשתמש ב-`<details>/<summary>` של HTML — אותה פונקציונליות, בלי JavaScript.

---

### ש: למה CSS Modules ולא Tailwind?

> **ת:** CSS Modules נותנים scoping אוטומטי ואפס runtime cost. הם מאפשרים שליטה מלאה על ה-CSS ומייצרים HTML נקי וקריא. לפרויקט בגודל הזה (28 קומפוננטות) זה עובד מצוין. אם הפרויקט היה גדול יותר עם צוות, Tailwind היה עשוי להיות עדיף ל-consistency וסקלביליות, כי כל ה-design decisions כבר מובנות בfirewall. זה trade-off בין קריאות HTML לבין מהירות פיתוח.

---

### ש: איך בנית את מערכת ה-Design Tokens?

> **ת:** הגדרתי ~40 CSS custom properties בקובץ tokens.css מרכזי — צבעים, רדיוסים, צלליות. במקום לכתוב `#9c1b20` בכל מקום, כותבים `var(--color-curtain-red)`. זה מאפשר עקביות ושינויים מרכזיים. בריפקטור, החלפתי 65 ערכים hardcoded ב-12 קבצי CSS.

---

### ש: למה בחרת בJoin Table לז׳אנרים ולא במערך?

> **ת:** PostgreSQL תומך ב-String arrays, אבל Join Table (`ShowGenre`) מאפשר סינון ב-SQL עם JOINs, אינדוקסים, ו-referential integrity — הDB מוודא שכל ז׳אנר קיים. עם מערך, הייתי צריך `@> ARRAY['דרמה']` שקשה יותר לאנדקס ולא מוודא שהערכים תקינים.

---

### ש: למה `Promise.allSettled` ולא `Promise.all` בעמוד הבית?

> **ת:** עמוד הבית מריץ 6 שאילתות מקבילות — featured show, top-rated, דרמות, קומדיות, מחזמרים, ישראליות. אם אחת נכשלת (למשל בגלל timeout), `Promise.all` היה מפיל את כל העמוד. `Promise.allSettled` מאפשר graceful degradation — סקציה שנכשלה פשוט לא מוצגת, והמשתמש מקבל חוויה חלקית במקום דף שגיאה.

---

### ש: איך הגנת על ה-API מפני תקיפות?

> **ת:** יש כמה שכבות:
>
> 1. **CSRF middleware** — בודק שה-Origin header מתאים ל-Host. מונע מאתר אחר לשלוח בקשות POST בשם המשתמש
> 2. **Rate limiting** — 3 ביקורות לשעה (DB-backed), 10 עריכות לשעה (in-memory)
> 3. **Security headers** — nosniff, deny iframes, strict referrer
> 4. **סינון תוכן** — profanity filter בעברית ובאנגלית
> 5. **Zod validation** — כל input עובר validation בצד שרת
> 6. **Owner-only mutations** — משתמש יכול רק לערוך/למחוק ביקורות שלו

---

### ש: מה ההבדל בין Rate Limiting מבוסס DB לבין מבוסס זיכרון?

> **ת:** מבוסס DB (ליצירת ביקורות) — שואל `SELECT COUNT(*) FROM Review WHERE userId=? AND createdAt > NOW()-1h`. עמיד ב-restart ובמספר instances. מבוסס זיכרון (לעריכות) — Map בזיכרון עם sliding window. מהיר יותר (לא צריך שאילתת DB), אבל מתאפס ב-restart. עריכות פחות קריטיות מיצירה, אז ה-trade-off מתקבל.

---

### ש: מה היית משפר/ת בפרויקט אם היה לך עוד זמן?

> **ת:** כמה דברים:
>
> 1. **Dark mode** — התשתית מוכנה (tokens מרוכזים), צריך להוסיף media query וtoken overrides
> 2. **תמיכה בi18n** — כרגע הכל hardcoded בעברית. אפשר להוסיף אנגלית עם `next-intl`
> 3. **Caching layer** — להוסיף Redis ל-rate limiting (במקום זיכרון) ולcaching של שאילתות
> 4. **Image upload** — כרגע תמונות הן סטטיות ב-public. אפשר להוסיף upload ל-S3/Cloudinary
> 5. **Testing** — כל שכבה צריכה בדיקות: unit tests לutils, integration tests ל-API, E2E עם Playwright
> 6. **Pagination cursor-based** — במקום offset, שעלול לדלג על תוצאות בזמן הוספת תוכן
> 7. **Server Actions של Next.js** — במקום חלק מה-API routes, שמפשט את ה-data mutation flow

---

### ש: מהם האתגרים שנתקלת בהם?

> **ת:**
>
> 1. **RTL עם ספריות צד-שלישי** — Radix UI ו-Embla Carousel לא תומכים ב-RTL אוטומטית. הייתי צריך/ה `RadixDirectionProvider` ו-`direction: "rtl"` ב-Embla
> 2. **Scroll lock של Radix** — כש-Dialog נפתח, Radix מוסיף `react-remove-scroll-bar` שגורם לlayout shift. פתרתי עם CSS hack ספציפי
> 3. **Server vs Client boundary** — צריך לחשוב בזהירות מה עובר דרך props בין Server ל-Client. לא ניתן להעביר פונקציות או objects לא-serializable
> 4. **Neon serverless** — connectionים רגילים לא עובדים ב-serverless. הייתי צריך/ה adapter מיוחד שמשתמש ב-WebSocket ולזהות אותו אוטומטית

---

### ש: למה JWT ולא session-based auth?

> **ת:** JWT מאוחסן בcookie ולא דורש שאילתת DB בכל request — חשוב בסביבת serverless שבה כל function היא stateless ויקרה. החיסרון הוא שאי אפשר לבטל session ספציפי מצד השרת. לפרויקט הזה, ה-trade-off מתקבל — אין צורך ב-session revocation מיידית.

---

### ש: מה הגישה שלך לSEO?

> **ת:** גישה מקיפה: metadata ייחודי לכל דף, canonical URLs, structured data (JSON-LD) לWebSite, Organization, BreadcrumbList, ו-CreativeWork עם AggregateRating. Sitemap דינמי שנבנה מה-DB, ו-robots.txt שחוסם API routes ודפי טפסים. דפים לא-קנוניים (פאגינציה > 1, חיפושים) מסומנים `noindex`.

---

### ש: הסבר/י את הריפקטור שעשית

> **ת:** 21 שיפורים ב-8 תחומים. הנקודות המרכזיות:
>
> - **CSS:** מ-7 ל-~40 tokens, החלפת 65 ערכים hardcoded, מיזוג CSS כפול
> - **שכבת נתונים:** קובץ אחד ענק פוצל ל-3 קבצים ממוקדים, מנגנון `fetchShowsByIds` משותף ביטל שכפול קוד פי 3
> - **קומפוננטות:** Header פוצל מ-300 שורות ל-3 תתי-קומפוננטות, ReviewCard הומר מClient לServer
> - **API:** הוצאת middleware משותף לauth + rate-limit, helpers לprofanity ו-validation
> - **ניקיון:** מחיקת dead code, unification של cx(), מעבר מ-`comment` ל-`text` בreview

---

# חלק ג׳: סיפור אתגר — Server vs Client Component Boundary

_הסיפור הזה בנוי בפורמט STAR — מציג בעיה, חשיבה, פתרון ותוצאה. תרגלו אותו בקול רם._

---

## הקונטקסט

באפליקציה יש דפי הצגה שמציגים רשימת ביקורות. כל ביקורת יכולה להיות ארוכה, אז יש מנגנון "קרא עוד / קרא פחות" שמקצר את הטקסט ל-3 שורות.

בגרסה הראשונה, ה-`ReviewCard` היה **Client Component** — הוא השתמש ב-`useState` בוליאני (`isExpanded`) ו-`onClick` handler כדי לעשות toggle על הטקסט.

**מה הבעיה?**

Client Component אומר שכל ה-JavaScript של הקומפוננטה נשלח לדפדפן, ואז עובר **hydration** — React צריך "להחיות" את ה-HTML שהגיע מהשרת ולחבר אליו event listeners. בדף הצגה אחד יכולים להיות 10, 20 ביקורות — כל אחד מהם שולח JS ועובר hydration, רק בשביל toggle פשוט.

---

## מה רציתי להשיג

רציתי לשמור על אותה חוויית משתמש — קיצור טקסט עם "קרא עוד/פחות" — אבל בלי לשלם את המחיר של Client Component. השאלה הייתה: **האם ה-interactivity הזו באמת דורשת React state?**

---

## מה עשיתי

גיליתי שב-HTML יש אלמנט מובנה בשם `<details>/<summary>` שעושה בדיוק expand/collapse — בלי שורה אחת של JavaScript. הדפדפן מנהל את ה-state לבד.

**המימוש:**

1. הסרתי את `"use client"` מהקומפוננטה
2. החלפתי את ה-`useState` + `onClick` ב-`<details>/<summary>` של HTML
3. הטקסט המקוצר יושב בתוך `<summary>` עם CSS line-clamp של 3 שורות
4. כשהמשתמש לוחץ, `<details>` נפתח — וב-CSS אני מזהה את המצב `[open]` ומבטל את ה-line-clamp
5. גם הטקסט של הכפתור ("קרא עוד" ↔ "קרא פחות") מוחלף **רק ב-CSS** — דרך `data-*` attributes ו-`::after` עם `content: attr(data-closed)` / `content: attr(data-open)`

**למה לא להשאיר Client?**

בדף בודד זה לא נורא. אבל הפאטרן חשוב: כל Client Component שאפשר להמיר ל-Server חוסך JavaScript bundle, hydration time, ו-double rendering. כשיש רשימה של 20 ביקורות, זה מצטבר.

---

## התוצאה

**אפס JavaScript** לכל כרטיסי הביקורות. הקומפוננטה מרונדרת על השרת, מגיעה כ-HTML מוכן, ולא שולחת שום קוד לדפדפן. אותה חוויית משתמש, ביצועים טובים יותר.

ותיעדתי את ההחלטה ב-CSS עצמו — הוספתי קומנט `/* Server-component expand/collapse via <details> */` — כדי שמי שקורא את הקוד בעתיד יבין למה זה בנוי ככה.

---

## הפאטרן הרחב יותר

ה-`ReviewCard` הוא דוגמה לעיקרון רחב יותר בפרויקט: **Client Component רק כשמוכרחים**. מתוך 28 קומפוננטות, רק 12 הן Client — וכל אחת עם הצדקה ברורה:

- **`WatchlistButton`** — חייב state אופטימיסטי + fetch mutations
- **`ShowCarousel`** — ספריית Embla צריכה DOM refs ו-event subscriptions
- **`ShowsFilterBar`** — `useOptimistic` של React 19 + `useTransition` לניווט
- **`ReviewForm`** — react-hook-form עם Zod validation
- **`Header`** — session state, mobile menu, Radix Dialog

לעומת זאת, קומפוננטות כמו `ShowCard`, `Pagination`, `Card`, `Tag` — הן Server כי הן pure render. גם `ShowsContent` הוא Server Component שמרכיב בתוכו ילדים Client — הוא מביא את הנתונים בשרת ומעביר אותם כ-props.

---

## שאלות המשך צפויות ותשובות

**ש: מה ה-trade-off? יש חיסרון ל-`<details>/<summary>`?**

> כן — קצת פחות שליטה באנימציות. עם React state הייתי יכול להוסיף transition חלק על הגובה. עם `<details>` זה מידי. בחרתי ביצועים על אנימציה כי ה-UX הוא תוכן — אנשים רוצים לקרוא ביקורות, לא לראות אנימציות.

**ש: מה קורה עם SEO? הטקסט המוסתר מאונדקס?**

> כן — `<details>` שומר את ה-HTML ב-DOM גם כשהוא סגור. גוגל מאנדקס את כל הטקסט. עם Client Component + conditional render, היה סיכון שגוגל לא יראה את הטקסט המלא.

**ש: איך קובעים מה Server ומה Client כשמתחילים קומפוננטה חדשה?**

> ברירת מחדל — Server. אני שואל: "האם הקומפוננטה הזו צריכה `useState`, `useEffect`, event handler, או browser API?" אם כן — Client. אם לא — Server. ואם רק חלק קטן צריך interactivity, אני שומר את ההורה כ-Server ושם רק את החלק האינטראקטיבי ב-Client — כמו שהדף `shows/[id]/page.tsx` הוא Server שמכיל `WatchlistButton` (Client) בתוכו.

---

# חלק ד׳: שיפור עתידי — Caching בשכבת הנתונים

_כשישאלו "מה היית משפר?" — זה נושא מעולה כי הוא מראה הבנה של איפה יש בזבוז ואיך לפתור את זה בצורה מדורגת._

---

## הבעיה הנוכחית — כל בקשה הולכת ישירות ל-DB

בפרויקט יש caching **ברמת הדף** (ISR עם `revalidate = 120` בעמוד הבית ודפי הצגה), אבל **שכבת הנתונים עצמה לא שומרת כלום בcache**. מה זה אומר בפועל:

**1. API routes — תמיד פונים ל-DB:**

```
משתמש פותח "הביקורות שלי" → GET /api/me/reviews → שאילתת Prisma → DB
משתמש מרענן את הדף → GET /api/me/reviews → שאילתת Prisma → DB   (שוב!)
```

כל GET ל-`/api/me/reviews` ול-`/api/watchlist` עושה שאילתת DB מחדש — גם אם כלום לא השתנה מאז הפעם הקודמת.

**2. עמוד הבית — 6 שאילתות כל 2 דקות:**
ISR שומר את ה-HTML, אבל כשעוברות 120 שניות ומישהו מבקש את הדף — Next.js בונה אותו מחדש. זה מריץ **6 שאילתות DB במקביל** (featured, top-rated, דרמות, קומדיות, מחזמרים, ישראליות). רוב הנתונים האלה כמעט לא משתנים — הצגה חדשה מתווספת אולי פעם בשבוע.

**3. אותו מידע נשלף כמה פעמים:**
הרשימות של תיאטראות וז׳אנרים (ל-dropdowns בדף `/shows`) נשלפות מה-DB **בכל בקשה** — למרות שהן כמעט סטטיות.

**בקיצור:** הDB עובד הרבה יותר ממה שצריך. כל פניה = חיבור + שאילתה + CPU בשרת DB. עם traffic גבוה, זה הופך לצוואר בקבוק.

---

## הפתרון: `unstable_cache` של Next.js

Next.js מספק כלי מובנה בשם `unstable_cache` (מ-`next/cache`) שעושה דבר פשוט: **שומר את התוצאה של פונקציה, ובפעם הבאה שקוראים לה — מחזיר את התשובה השמורה במקום לרוץ שוב.**

הרעיון דומה ל-ISR, אבל **ברמת הפונקציה** ולא ברמת הדף. ובנוסף — אפשר לקבוע **תגיות (tags)** שמאפשרות למחוק cache ספציפי כשהנתונים משתנים.

**איך זה עובד — דוגמה פשוטה:**

```typescript
import { unstable_cache } from "next/cache";

// לפני — כל קריאה הולכת ל-DB
async function getReviewsByUser(userId: string) {
  return prisma.review.findMany({ where: { userId } });
}

// אחרי — התוצאה נשמרת ל-60 שניות
const getCachedReviewsByUser = unstable_cache(
  async (userId: string) => {
    return prisma.review.findMany({ where: { userId } });
  },
  ["user-reviews"], // מפתח ייחודי ל-cache
  {
    tags: ["reviews"], // תגית — לinvalidation
    revalidate: 60, // כל 60 שניות לכל היותר
  },
);
```

**מה קורה עכשיו:**

```
קריאה ראשונה  → DB → שומר בcache → מחזיר תשובה
קריאה שנייה   → cache hit!      → מחזיר תשובה מיד (בלי DB)
קריאה אחרי 60 שניות → DB → מעדכן cache → מחזיר תשובה
```

---

## מה הייתי מוסיף cache — שלושה מקומות

### מקום 1: נתונים סטטיים — רשימות תיאטראות וז׳אנרים

ב-`src/lib/data/showsList.ts`, כל פעם שמשתמש נכנס לדף `/shows`, הפונקציה `getFilterOptions()` שואלת את ה-DB מה הם כל התיאטראות וכל הז׳אנרים הקיימים (כדי להציג אותם ב-dropdowns). אבל הרשימה הזו כמעט לא משתנה — תיאטרון חדש נוסף אולי פעם בחודש.

```typescript
const getCachedFilterOptions = unstable_cache(
  getFilterOptions,
  ["filter-options"],
  {
    tags: ["shows"],
    revalidate: 3600, // שעה — הנתונים כמעט לא משתנים
  },
);
```

**החיסכון:** מעבר מ-2 שאילתות DB בכל כניסה לדף, ל-2 שאילתות בשעה.

### מקום 2: עמוד הבית — 6 שאילתות שרובן יציבות

ב-`src/lib/data/homepage.ts`, ההצגה הנבחרת (featured), דרמות מובילות, קומדיות מובילות — אלה רשימות שמשתנות רק כשמישהו מוסיף ביקורת חדשה. אפשר לשמור אותן בcache עם תגית `"reviews"`:

```typescript
const getCachedHomePageData = unstable_cache(
  getHomePageData,
  ["homepage-data"],
  {
    tags: ["reviews", "shows"],
    revalidate: 300, // 5 דקות
  },
);
```

**החיסכון:** במקום 6 שאילתות כל 2 דקות (בגלל ISR), 6 שאילתות כל 5 דקות — ובינתיים הcache משרת מיד.

### מקום 3: Watchlist status — בדף הצגה בודדת

כשמשתמש מחובר נכנס לדף הצגה (`/shows/[id]`), הקוד בודק "האם ההצגה הזו ברשימת הצפייה שלי?" — שאילתת DB פשוטה שמחזירה true/false. אם המשתמש גולש בין כמה הצגות, כל אחת גורמת לשאילתה.

```typescript
const getCachedIsInWatchlist = unstable_cache(
  isShowInWatchlist,
  ["watchlist-check"],
  {
    tags: ["watchlist"],
    revalidate: 60,
  },
);
```

---

## החלק הכי חשוב — Invalidation (ניקוי cache כשנתונים משתנים)

Cache בלי invalidation = מידע לא עדכני. הכלי הוא `revalidateTag()` מ-`next/cache`:

```typescript
import { revalidateTag } from "next/cache";
```

**מתי לקרוא ל-`revalidateTag`:**

| פעולה של המשתמש       | מה קורה                                     | איזה cache ננקה              |
| --------------------- | ------------------------------------------- | ---------------------------- |
| כותב ביקורת חדשה      | `POST /api/reviews` → אחרי שמירה ב-DB       | `revalidateTag("reviews")`   |
| עורך ביקורת           | `PATCH /api/reviews/[id]` → אחרי עדכון ב-DB | `revalidateTag("reviews")`   |
| מוחק ביקורת           | `DELETE /api/reviews/[id]` → אחרי מחיקה     | `revalidateTag("reviews")`   |
| מוסיף הצגה לwatchlist | `POST /api/watchlist` → אחרי שמירה          | `revalidateTag("watchlist")` |
| מסיר הצגה מwatchlist  | `DELETE /api/watchlist/[showId]`            | `revalidateTag("watchlist")` |

**דוגמה בAPI route:**

```typescript
// src/app/api/reviews/route.ts — POST (יצירת ביקורת)

// ... validation, rate limiting, שמירה ב-DB ...
await prisma.review.create({ data: reviewData });

// ← שורה אחת חדשה — מנקה את כל ה-caches שתויגו "reviews"
revalidateTag("reviews");

return NextResponse.json({ success: true });
```

**מה קורה ברגע שקוראים `revalidateTag("reviews")`:**
Next.js מסמן את **כל** ה-cached results שיש להם את התגית `"reviews"` כלא-תקפים. בפעם הבאה שמישהו מבקש אותם — הם ירוצו מחדש ויישמרו מחדש. זה כולל את נתוני עמוד הבית ואת הביקורות של המשתמש.

---

## למה זה שיפור טוב לדבר עליו בראיון

**1. לא צריך תלות חיצונית** — `unstable_cache` ו-`revalidateTag` הם חלק מ-Next.js. לא צריך Redis, לא צריך שירות נוסף.

**2. שינוי מינימלי בקוד** — עוטפים פונקציה קיימת ב-`unstable_cache`, מוסיפים שורת `revalidateTag` בAPI routes. לא צריך לשכתב שום דבר.

**3. מראה חשיבה על trade-offs:**

|                   | ללא cache (היום)     | עם cache                                                 |
| ----------------- | -------------------- | -------------------------------------------------------- |
| **עדכניות**       | תמיד עדכני           | עד 60 שניות lag (סביר לאתר תוכן)                         |
| **עומס על DB**    | שאילתה בכל בקשה      | שאילתה רק כשcache פג/נמחק                                |
| **מורכבות**       | פשוט — שאילתה ותשובה | צריך לחשוב: "מתי לנקות cache?"                           |
| **סיכון**         | אין — תמיד מה-DB     | cache stale = מידע ישן (אבל `revalidateTag` ממזער את זה) |
| **תלויות נוספות** | אין                  | אין — מנגנון מובנה של Next.js                            |

---

## שאלות המשך צפויות ותשובות

**ש: למה `unstable_cache` ולא סתם ISR?**

> ISR שומר את **הדף השלם** ב-cache. `unstable_cache` שומר את **תוצאת הפונקציה**. ההבדל חשוב: שני דפים שונים יכולים לקרוא לאותה פונקציה cached. למשל, אם נתוני עמוד הבית ודף הצגה בודדת שניהם צריכים ביקורות — הcache משותף. ובנוסף, `revalidateTag` נותן שליטה מדויקת — אפשר לנקות רק cache של ביקורות בלי לפגוע בcache של הצגות.

**ש: מהו `unstable_cache`? למה הוא "unstable"?**

> זו פונקציה של Next.js שנמצאת בתהליך התייצבות — ה-API עלול להשתנות בגרסאות עתידיות, אבל הפונקציונליות עובדת ויציבה. Next.js משתמשים בה ב-production. השם "unstable" מתייחס ליציבות ה-API, לא ליציבות הביצועים.

**ש: מה קורה אם שכחת לקרוא `revalidateTag` אחרי mutation?**

> המשתמש יראה מידע ישן — עד שה-`revalidate` time יעבור (למשל 60 שניות). זה הסיכון העיקרי. לכן חשוב שה-invalidation יהיה צמוד ל-mutation — באותו API route, מיד אחרי השמירה ל-DB.

**ש: למה לא Redis ל-caching?**

> Redis מוסיף שירות חיצוני, env vars, ותלות שיכולה ליפול. `unstable_cache` מובנה ב-Next.js ועובד בלי שום הגדרה נוספת. לפרויקט בגודל הזה, הכלי המובנה מספיק. Redis שווה כשצריך cache שמשותף בין servers שונים של Next.js, או כשצריך שליטה גרנולרית יותר (TTL פר-key, eviction policies).

**איך לומר את זה בראיון:**

> "היום, כל פנייה ל-API routes הולכת ישירות ל-DB — גם אם הנתונים לא השתנו. אם היה לי עוד זמן, הייתי עוטף את פונקציות הdata ב-`unstable_cache` של Next.js עם תגיות. למשל, נתוני עמוד הבית מתויגים `reviews` — וכשמשתמש כותב ביקורת, קורא `revalidateTag('reviews')` ב-API route. כך הDB עובד רק כשבאמת צריך, בלי להוסיף תלויות חיצוניות."

</div>
