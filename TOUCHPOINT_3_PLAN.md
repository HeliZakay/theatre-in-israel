# Touchpoint 3: Homepage Community Banner

## When

Every visitor to the homepage sees it.

## Where

In the currently-empty slot between the Hero and the show carousels (where `LotteryBanner` would go if lottery were active). This is prime real estate that's currently rendering nothing.

## What the user sees

A warm-toned banner (visually distinct from the wine-red CtaStrip at the bottom — perhaps softer, more inviting colors), with:

- **Headline:** "בואו להיות חלק מהקהילה" or "תיאטרון בישראל רוצה לשמוע את דעתכם"
- **Body:** "כתבו ביקורת קצרה על הצגה שראיתם — כל מילה עוזרת לאוהבי תיאטרון לבחור את ההצגה הבאה שלהם."
- **Button:** "כתב.י ביקורת" → `/reviews/new`

## Why this works

- Sets the community tone from the very first scroll — "this site wants my voice"
- The current homepage goes: Hero (value for readers) → nothing → show carousels (browsing). Adding a community banner creates: Hero (value for readers) → **invitation to contribute** → show carousels. This plants the seed before they start browsing.
- Different from the CtaStrip at the bottom (which is more action-oriented: "help others choose"). This banner is about **belonging** — "be part of the community"

## Important distinction

This banner should **not** duplicate the CtaStrip. They have different purposes:

| Component        | Position         | Tone                       | Message                                                   |
| ---------------- | ---------------- | -------------------------- | --------------------------------------------------------- |
| Community banner | Top (after hero) | Emotional, about belonging | "we want to hear from you"                                |
| CtaStrip         | Bottom           | Practical, about action    | "a few minutes of writing can save someone a bad evening" |

## Lottery coexistence

When the lottery is eventually enabled, this slot switches to the `LotteryBanner`. The community messaging moves into a secondary position or the lottery banner absorbs the community tone into its own copy.

---

## Technical notes

- **Location in code:** `src/app/page.tsx` — between `<Hero>` and `<ShowsSectionsContent>`
- **Current state:** `<LotteryBanner>` renders `null` when lottery is disabled (`LOTTERY_CONFIG.enabled = false`)
- **Implementation approach:** Create a `CommunityBanner` component that renders when lottery is NOT active, or modify the slot logic to show this banner as a fallback
