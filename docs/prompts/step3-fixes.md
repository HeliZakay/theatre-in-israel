## Fixes for the events page (step 3)

**1. Dead variable** — in `buildPageTitle`, line 109, `const parts: string[] = ["הופעות תיאטרון"]` is declared but never used. Remove it.

**2. JSON-LD timezone** — in the ItemList JSON-LD (line 330), `startDate` outputs `T20:00:00` without a timezone offset. Change to include Israel timezone:
```
`${event.date.slice(0, 10)}T${event.hour}:00+03:00`
```
(+03:00 is Israel Daylight Time which covers most of the theatre season. This is acceptable — Google prefers a timezone over none.)

**3. Duplicate theatre name in venue line** — line 491 always renders `{theatre} · {venueName}, {city}`, which produces "תיאטרון הקאמרי · תיאטרון הקאמרי, תל אביב" for shows at their home venue. Add logic to omit the theatre name when the venue name already contains it:
```tsx
{event.venueName.includes(event.showTheatre)
  ? `${event.venueName}, ${event.venueCity}`
  : `${event.showTheatre} · ${event.venueName}, ${event.venueCity}`}
```

**4. Review CTA** — line 499-505, change the review CTA text from "כתוב.י ביקורת" to "ראיתם? כתבו ביקורת ←" and link to `/shows/{slug}/review` instead of `#write-review`:
```tsx
<Link
  href={`/shows/${event.showSlug}/review`}
  className={styles.reviewCta}
  aria-label={`כתבו ביקורת על ${event.showTitle}`}
>
  ראיתם? כתבו ביקורת ←
</Link>
```
Note the `aria-label` per the accessibility requirements in the plan.
