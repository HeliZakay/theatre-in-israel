Post-Batch Watchlist Discovery — Implementation Plan
Context
Users who finish the batch review flow have no exposure to the watchlist feature. The spec (docs/post-batch-watchlist-spec.md) adds watchlist promotion to the exit screen, enriches the watchlist page with event data, and improves watchlist visibility across the app. No toast/notification system exists yet.

Task 1: Toast System + WatchlistToggle Feedback
Build a lightweight toast component and wire it into the existing watchlist toggle so every add-to-watchlist shows "נוסף לרשימה".

New files:

src/components/ui/Toast/Toast.tsx + Toast.module.css — fixed-position, RTL, auto-dismiss ~3s, aria-live="polite"
src/components/ui/Toast/ToastProvider.tsx — context with showToast(message: string, action?: { label: string; onClick: () => void })
Modified files:

App layout (src/app/layout.tsx) — mount ToastProvider
src/components/shows/WatchlistToggle/WatchlistToggle.tsx — call showToast("נוסף לרשימה") after successful add
Deliverable: Any WatchlistToggle click site-wide shows a toast. Testable immediately.

Task 2: Exit Screen Enhancements
Add watchlist toggles, next-event dates, and a CTA banner to the batch review exit screen.

Modified files:

src/lib/data/batchReview.ts — extend BatchShowItem with nextEventDate?: string, nextEventHour?: string, nextEventVenue?: string. Modify fetchBatchShows() to include the soonest future event per show via Prisma events: { take: 1, where: { date: { gte: today } }, orderBy: { date: 'asc' }, include: { venue: true } }
src/components/batch-review/ExitSummary.tsx:
Rec cards: add WatchlistToggle (default/overlay variant) + next event date line ("ההצגה הקרובה: יום ה׳ 24.4, 20:00")
CTA banner above recommendations: "שמרו הצגות לרשימת הצפייה שלכם וגלו מתי ההצגות הקרובות"
Post-save nudge: after >= 1 save, show inline link "הרשימה שלכם שמורה → לרשימת הצפייה" (new tab)
src/components/batch-review/ExitSummary.module.css — styles for watchlist overlay on rec cards, event date line, CTA banner, nudge link
Deliverable: Exit screen promotes watchlist with event context. Testable by completing a batch review.

Task 3: Watchlist Page Events + Show Detail + Post-Review Toast
Three independent sub-items bundled because each is small.

3a. Watchlist page: events + sort
src/lib/showHelpers.ts — new fetchShowListItemsWithEvents(ids) joining shows with next upcoming event + venue
src/types/index.ts — add optional nextEvent field to ShowListItem (or create extended type)
src/app/me/watchlist/page.tsx — use new query, sort by soonest event first, no-events shows last
src/components/shows/ShowCard/ShowCard.tsx + .module.css — conditionally render next event date/time/venue and ticket link when event data present
3b. Show detail watchlist prominence
src/components/shows/WatchlistButton/WatchlistButton.tsx + .module.css — add bookmark icon, increase visual weight (padding, border)
3c. Post single-review watchlist toast
src/components/reviews/InlineReviewForm/InlineReviewForm.tsx — after successful review submit, if show not in watchlist, show toast: "רוצים לעקוב אחרי הצגה זו? [הוספה לרשימה]" using the action-toast from Task 1
Deliverable: Watchlist page shows events sorted by date. Show detail has prominent save button. Single-review submit nudges watchlist add.

Dependency Graph
Task 1 (Toast infrastructure)
├──> Task 2 (Exit screen)
└──> Task 3 (Watchlist page + detail + post-review)
Tasks 2 and 3 are independent of each other.

Verification
Task 1: Click any WatchlistToggle (e.g., on /shows page) → toast appears and auto-dismisses
Task 2: Complete a batch review → exit screen shows event dates on rec cards, watchlist toggles work, CTA banner visible, nudge appears after saving
Task 3a: Add shows to watchlist → /me/watchlist shows event dates, sorted by soonest
Task 3b: Visit any show detail page → watchlist button is visually prominent with icon + label
Task 3c: Submit a single review → toast offers watchlist add
Run npm run build and npm test after each task
