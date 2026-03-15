## Task: Extract event components from the events page

This is step 4 of building the `/events` page. Steps 1-3 are done: the page at `src/app/events/[[...filters]]/page.tsx` renders inline JSX for chips, date headers, and event items. Now extract this into clean, reusable components.

### What to do

Extract the inline rendering from `page.tsx` into 5 new component files. The page component should become a thin orchestrator that fetches data and delegates to components.

### Component file structure

Follow the existing pattern in the project: each component gets its own folder with a `.tsx` and `.module.css` file. For example, see `src/components/ShowsSection/ShowsSection.tsx`.

All components are **server components** (no "use client") — the page works without JS.

### Components to create

**1. `src/components/Events/DateChips.tsx` + `DateChips.module.css`**

Extract the date preset `<nav role="radiogroup">` block (page.tsx lines 379-404).

Props:
```ts
interface DateChipsProps {
  datePreset: string;       // current active preset slug
  locationSlug?: string;    // current region or city slug (to preserve in URLs)
}
```

- Renders `<nav role="radiogroup" aria-label="סינון לפי תאריך">` with one `<a role="radio">` per `DATE_SLUGS` entry
- Active chip gets `aria-checked="true"` and active styling
- Each chip href is the clean URL combining the date preset + current location
- Import `DATE_SLUGS`, `DEFAULT_DATE_PRESET` from `@/lib/eventsConstants` and `eventsPath` from `@/constants/routes`
- Move the `buildFilterUrl` helper from page.tsx into this file (or into a shared file if RegionChips also needs it — see below)

**2. `src/components/Events/RegionChips.tsx` + `RegionChips.module.css`**

Extract the region `<nav role="radiogroup">` block (page.tsx lines 407-443).

Props:
```ts
interface RegionChipsProps {
  region?: string;          // current active region slug
  city?: string;            // current active city slug
  datePreset: string;       // current date preset (to preserve in URLs)
  regionCounts: Record<string, number>;  // event counts per region
}
```

- Renders `<nav role="radiogroup" aria-label="סינון לפי אזור">` with "הכל" + one chip per `REGION_SLUGS` entry
- "הכל" is active when no region and no city is selected
- Each region chip shows a count badge from `regionCounts`
- Disabled chips (count === 0): `aria-disabled="true"`, `tabIndex={-1}`, disabled styling, but still visible
- Import `REGION_SLUGS`, `DEFAULT_DATE_PRESET` from `@/lib/eventsConstants` and `eventsPath` from `@/constants/routes`

**Shared helper**: Both DateChips and RegionChips need the `buildFilterUrl(datePreset, locationSlug)` function currently in page.tsx. Put it in a small shared file `src/components/Events/buildFilterUrl.ts`:
```ts
import { DEFAULT_DATE_PRESET } from "@/lib/eventsConstants";
import { eventsPath } from "@/constants/routes";

export function buildFilterUrl(
  datePreset: string | undefined,
  locationSlug: string | undefined,
): string {
  const segments: string[] = [];
  if (datePreset && datePreset !== DEFAULT_DATE_PRESET) segments.push(datePreset);
  if (locationSlug) segments.push(locationSlug);
  return eventsPath(segments);
}
```

**3. `src/components/Events/EventCard.tsx` + `EventCard.module.css`**

Extract the `<article>` event item (page.tsx lines 480-510).

Props:
```ts
interface EventCardProps {
  hour: string;
  showTitle: string;
  showSlug: string;
  showTheatre: string;
  showAvgRating: number | null;
  showReviewCount: number;
  venueName: string;
  venueCity: string;
}
```

Product rules that must be preserved:
- **Duplicate theatre name suppression**: When `venueName` already contains `showTheatre`, show only `{venueName}, {venueCity}`. Otherwise show `{showTheatre} · {venueName}, {venueCity}`.
- **Rating display**: If `showAvgRating` is not null, show `"{rating} ★"`. If `showAvgRating` is null AND `showReviewCount === 0`, show review CTA: `"ראיתם? כתבו ביקורת ←"` linking to `/shows/{showSlug}/review` with `aria-label="כתבו ביקורת על {showTitle}"`.
- **Title links** to `/shows/{showSlug}` via `showPath()` from `@/constants/routes`
- **Layout**: time on the right (RTL), title+venue in the middle, rating/CTA on the left
- **Hover**: title color change on hover (not translateY)

**4. `src/components/Events/EventsList.tsx` + `EventsList.module.css`**

Extract the date-grouped list with sticky headers (page.tsx lines 473-514).

Props:
```ts
interface DateGroup {
  dateKey: string;
  label: string;    // pre-formatted date header string
  events: EventCardProps[];
}

interface EventsListProps {
  groups: DateGroup[];
}
```

- Renders the list of `<section>` elements, each with a sticky `<h2>` date header and `EventCard` children
- The date header formatting logic (`formatDateHeader`, `hebrewDayFormatter`, `getTodayTomorrowKeys`) should move into this component or a local helper — it doesn't belong in page.tsx
- Actually, since this is a server component and the formatting depends on "today/tomorrow" at render time, keep the grouping + formatting logic in page.tsx and pass pre-formatted `DateGroup[]` to this component. This way EventsList is a pure presentational component.

**5. `src/components/Events/EventsEmptyState.tsx` + `EventsEmptyState.module.css`**

Extract the empty state block (page.tsx lines 455-471).

Props:
```ts
interface EventsEmptyStateProps {
  datePreset: string;
  region?: string;
  city?: string;
  nearestRegion: { slug: string; label: string; count: number } | null;
}
```

Product rules:
- **Filtered, no results**: "לא נמצאו הופעות ב{region/city} ב{date}. יש {count} הופעות ב{nearest region} ←" with a link to that region
- **No events at all** (no filters active): "אין הופעות קרובות כרגע."
- The suggestion link should preserve the current date preset

### Modify page.tsx

After creating the components, update `page.tsx`:
1. Remove all inline rendering JSX (chips, event items, empty state)
2. Remove the `buildFilterUrl` helper (moved to shared file)
3. Keep: filter parsing, data fetching, grouping, formatting, JSON-LD, breadcrumbs, metadata
4. Import and render the new components:

```tsx
<DateChips datePreset={datePreset} locationSlug={locationSlug} />
<RegionChips region={region} city={city} datePreset={datePreset} regionCounts={regionCounts} />
{hasNonDefaultFilter && <ClearFilterLink />}
{events.length === 0
  ? <EventsEmptyState ... />
  : <EventsList groups={dateGroupsFormatted} />}
```

5. The "נקו סינון" link is simple enough to stay inline in page.tsx (no need for its own component)

### Styling

Move the relevant CSS from `page.module.css` into the new component CSS modules. What should remain in `page.module.css`:
- `.page`, `.header`, `.title`, `.subtitle` — page-level layout
- `.clearRow`, `.clearLink` — clear filter link
- `.eventList` — the list wrapper (margin-top)

Everything else (chip styles, event item styles, empty state styles, date header styles) moves to the component CSS modules.

### Important constraints
- All components are server components — no "use client"
- Do NOT add any client-side interactivity or JavaScript behavior
- Do NOT add the FAQ section (that's step 5)
- Do NOT modify the data layer or constants files
- Do NOT change any routing, metadata, or SEO logic
- Preserve all existing product behaviors (duplicate name suppression, review CTA, disabled chips, etc.)
- Follow the existing component folder pattern: `src/components/Events/ComponentName.tsx`
