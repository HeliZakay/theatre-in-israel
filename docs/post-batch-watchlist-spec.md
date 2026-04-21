# Post-Batch Watchlist Discovery — Spec

## Goal
Users who finish the batch review flow should discover the watchlist feature and save shows with upcoming events, giving them a reason to return.

## What Changes

### 1. Exit Screen Enhancement (Step 4 of batch flow)

The exit screen already shows "more shows from same theatre" and "similar shows" sections. Enhance these:

- **Add a watchlist save button** on each recommended show card (heart icon or bookmark — match whatever the existing watchlist toggle uses). One tap to save, no confirmation needed. Visual feedback: icon fills in, brief "נוסף לרשימה" toast.
- **Show next event date** on each recommended show card, e.g. "ההצגה הקרובה: יום ה׳ 24.4, 20:00". If no upcoming events exist, show nothing (don't say "no dates" — just omit).
- **Add a banner/CTA** below the review summary, above the recommendations: "שמרו הצגות לרשימת הצפייה שלכם וגלו מתי ההצגות הקרובות" (Save shows to your watchlist and discover upcoming performances). Keep it one line, not a modal or popup.
- **After they save at least 1 show**, swap or append a subtle nudge: "הרשימה שלכם שמורה → [לרשימת הצפייה](/me/watchlist)" linking to their watchlist page. Opens in new tab (consistent with existing exit screen links).

### 2. Watchlist Page Enhancement

The existing watchlist page currently shows saved shows as a simple list. Enhance it:

- **Show upcoming event dates** for each saved show. Display the next 2-3 upcoming performances with date + time + venue. If a show has no upcoming events, show "אין הצגות קרובות כרגע".
- **Sort watchlist by next event date** (soonest first). Shows with no upcoming events go to the bottom.
- **Add "buy tickets" link** if ticket URL exists in DB (opens external link in new tab). If no ticket URL, omit.

### 3. Watchlist Visibility (quick wins)

The watchlist exists but nobody notices it. Small changes:

- On **show detail pages**, make sure the watchlist button is prominent (not hidden in a menu or looking like a decoration). Verify it has a label, not just an icon.
- After a user **submits a single review** (non-batch), show a brief toast: "רוצים לעקוב אחרי הצגה זו? [הוספה לרשימה]" — one-tap add without navigating away.

## Out of Scope
- Email notifications (Layer 3 — future)
- Location-based filtering
- Recommendation algorithm (use existing "similar shows" / "same theatre" logic)
- Changes to the batch review steps 1-3

## Technical Notes
- Reuse existing watchlist toggle component/logic
- Event dates already in DB — query upcoming events per show
- Exit screen is ephemeral (lost on refresh) — this is fine, no persistence needed
- All links on exit screen open in new tabs (existing pattern)

## Implementation
Plan to break into 2-3 tasks. Have Claude Code read this spec + the existing exit screen and watchlist code, then propose the task breakdown before starting.
