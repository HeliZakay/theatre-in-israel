## Task: SEO enrichment, FAQ, and accessibility polish for the events page

This is step 5 (final) of building the `/events` page. Steps 1-4 are done: the page renders with components, chips, sticky headers, and basic JSON-LD. Now enrich the SEO, add the FAQ section, and add remaining accessibility features.

### 1. Enrich Event JSON-LD

The current ItemList JSON-LD in `page.tsx` (around line 312) has minimal Event items. Add the missing fields from the plan to each Event item:

```js
{
  "@type": "Event",
  name: event.showTitle,
  startDate: `${event.date.slice(0, 10)}T${event.hour}:00+03:00`,
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  image: toAbsoluteUrl(getShowImagePath(event.showTitle)),
  url: toAbsoluteUrl(showPath(event.showSlug)),
  location: {
    "@type": "PerformingArtsTheater",
    name: event.venueName,
    address: { "@type": "PostalAddress", addressLocality: event.venueCity },
  },
  organizer: { "@type": "Organization", name: event.showTheatre },
  offers: {
    "@type": "Offer",
    url: toAbsoluteUrl(showPath(event.showSlug)),
    availability: "https://schema.org/InStock",
  },
}
```

The current JSON-LD is missing `eventAttendanceMode`, `eventStatus`, `organizer`, and `offers`. Add them.

### 2. FAQ component

Create `src/components/Events/EventsFAQ.tsx` + `EventsFAQ.module.css`.

Server component (no "use client"). Collapsible `<details>`/`<summary>` elements (native HTML, no JS needed).

Three questions:
1. **"איך אני יודע מה שווה לראות?"** → Answer: "לכל הצגה בלוח ההופעות מופיע דירוג ממוצע על בסיס ביקורות צופים. לחצו על שם ההצגה כדי לקרוא ביקורות מלאות ולהחליט בעצמכם."
2. **"איפה קונים כרטיסים?"** → Answer: "כרגע האתר לא מוכר כרטיסים — לחצו על שם ההצגה כדי לראות פרטים נוספים ולמצוא קישורים לרכישה באתרי התיאטרון."
3. **"מה זה תיאטרון בישראל?"** → Answer: "תיאטרון בישראל הוא אתר ביקורות והמלצות קהל להצגות תיאטרון. אנחנו אוספים מידע על הופעות מכל התיאטראות בארץ ומאפשרים לצופים לשתף חוויות ולעזור לאחרים לבחור מה לראות."

Also render `FAQPage` JSON-LD schema:
```js
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "...",
      acceptedAnswer: { "@type": "Answer", text: "..." },
    },
    // ...
  ],
}
```

Render the JSON-LD `<script>` inside the FAQ component itself.

Styling:
- Place at the bottom of the page, after the event list
- Subtle top border to separate from content
- `<summary>` elements styled as clickable with cursor pointer, padding, font-weight 600
- `<details>[open] summary` gets a different background or border to indicate open state
- Answers in `<p>` with padding and muted color
- Use existing CSS variables

### 3. Add FAQ to page.tsx

Import `EventsFAQ` and render it at the bottom of the `<main>`, after the EventsList/EmptyState block and before the closing `</main>` tag. It should always be visible regardless of filter state.

### 4. Accessibility additions

**a. Skip link** — Add a skip link inside `page.tsx` at the top of `<main>`, before the header:
```tsx
<a href="#events-list" className="skipLink">
  דלגו לרשימת ההופעות
</a>
```
Use the existing global `.skipLink` class from `globals.css` (it's already styled as a visually-hidden link that appears on focus). Add `id="events-list"` to the EventsList/EmptyState wrapper div.

**b. scroll-margin-top on event items** — Add to `EventCard.module.css`:
```css
.eventItem {
  scroll-margin-top: calc(var(--header-offset, 60px) + 48px);
}
```
This ensures that when a user navigates to an event via anchor/keyboard, the sticky date header doesn't cover it. The 48px accounts for the date header height.

**c. Result count announcement** — Add an `aria-live="polite"` region in `page.tsx` that announces the result count. Place it visually hidden near the top of the event list area:
```tsx
<div aria-live="polite" className="sr-only">
  {events.length > 0
    ? `נמצאו ${events.length} הופעות`
    : "לא נמצאו הופעות"}
</div>
```
For the visually-hidden class, use the existing pattern — check if the project has an `.sr-only` or `visually-hidden` utility class in globals.css. If not, add a `.srOnly` class to `page.module.css`:
```css
.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 5. Review count in date headers

The plan specifies date headers should show event count: "היום · יום חמישי, 20 במרץ · 4 הופעות". Check that the current `formatDateHeader` function in `page.tsx` includes the count. It should already be there from step 3 — just verify it says "הופעות" (plural). For count === 1, use "הופעה אחת" instead of "1 הופעות".

### Files to create
- `src/components/Events/EventsFAQ.tsx`
- `src/components/Events/EventsFAQ.module.css`

### Files to modify
- `src/app/events/[[...filters]]/page.tsx` — enrich JSON-LD, add skip link, add aria-live region, import+render EventsFAQ, add `id="events-list"` to list wrapper
- `src/app/events/[[...filters]]/page.module.css` — add `.srOnly` if no global equivalent exists
- `src/components/Events/EventCard.module.css` — add `scroll-margin-top`

### Important constraints
- Do NOT add "use client" to any component
- Do NOT change routing, metadata, or data-fetching logic
- Do NOT modify any other existing components or pages
- Do NOT add npm dependencies
- The FAQ uses native `<details>`/`<summary>` — no JS accordion library
