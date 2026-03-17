# SEO Improvement Plan

## Current State (March 2026)

Already in place:
- Structured data: WebSite, Organization, BreadcrumbList, CreativeWork, Event, ItemList, FAQPage
- Dynamic metadata on all public pages with title template
- Sitemap (dynamic, ISR-cached) + robots.txt
- Canonical URLs with proper noindex for filtered/paginated views
- Open Graph + Twitter cards on public pages
- Google Search Console verified
- Hebrew lang/dir/locale properly set
- Image optimization (WebP/AVIF, 1-year cache)
- Legacy numeric ID → slug redirects

## Top Queries (Search Console, March 2026)

| Query | Clicks | Impressions |
|-------|--------|-------------|
| קברט ביקורת | 6 | 19 |
| גבירתי הנאווה ביקורת | 5 | 45 |
| לילה ברומא ביקורות | 5 | 5 |
| התשמע קולי הצגה ביקורת | 3 | 16 |
| קברט | 2 | 15 |
| קברט ביקורות | 2 | 4 |
| הקאמרי קברט | 2 | 3 |
| הצגות מומלצות | 1 | 30 |
| גברתי הנאווה ביקורת | 1 | 17 |
| הדב השומר עליי | 1 | 10 |

**Key insight:** Traffic is dominated by `[show name] + ביקורת/ביקורות`. 538 total queries tracked.

---

## Improvement List (Prioritized)

### 1. Improve FAQ Questions for Search Intent
- **Status:** FAQPage schema already implemented in EventsFAQ component
- **Issue:** Current questions are conversational, not matching real search queries
- **Action:** Replace FAQ items with questions that match actual search patterns
- **Impact:** Low-Medium (Google has reduced FAQ rich results since 2023)
- **Effort:** Low

### 2. Add TheaterGroup / PerformingGroup Structured Data
- **Action:** Add Organization schema for each theatre company on show detail pages
- **Impact:** Medium — helps Google connect shows to producing companies
- **Effort:** Low

### 3. Add OG Image to Events Page
- **Action:** Add image to events page Twitter/OG metadata
- **Impact:** Low-Medium — improves social sharing CTR
- **Effort:** Low

### 4. Create Dedicated Theatre Pages (`/theatres/[slug]`)
- **Action:** New route with theatre info, their shows, upcoming events, aggregated ratings
- **Targets:** "תיאטרון הקאמרי הצגות", "תיאטרון הבימה ביקורות", "הקאמרי קברט" etc.
- **Impact:** HIGH — captures high-volume branded theatre queries
- **Effort:** Medium-High

### 5. Create Dedicated Genre Pages (`/genres/[slug]`)
- **Action:** New route for each genre with filtered shows
- **Targets:** "הצגות ילדים", "קומדיה תיאטרון", "מחזמר"
- **Impact:** Medium-High
- **Effort:** Medium

### 6. Blog / Content Section
- **Action:** Add `/blog` with editorial content (recommended shows, seasonal roundups, city guides)
- **Targets:** Long-tail informational queries
- **Impact:** HIGH (long-term) — builds topical authority
- **Effort:** High
- **Deferred:** User wants to start simpler first

### 7. Dedicated Reviews Page per Show (`/shows/[slug]/reviews`)
- **Action:** Separate indexable page for reviews with ReviewPage schema
- **Targets:** "[show name] ביקורות" queries
- **Impact:** Medium
- **Effort:** Medium

### 8. Optimize Default Fallback Image
- **Action:** Convert `/public/show-img-default.png` from PNG (~1.6MB) to WebP
- **Impact:** Medium — improves Core Web Vitals (LCP) for shows without posters
- **Effort:** Low

### 9. Add Pagination Hints (prev/next)
- **Action:** Add `rel="prev"` / `rel="next"` meta links for paginated show listings
- **Impact:** Low-Medium
- **Effort:** Low

### 10. City Landing Pages (`/cities/[city]`)
- **Action:** Dedicated pages for "הצגות בתל אביב", "תיאטרון בחיפה" etc.
- **Impact:** Medium-High
- **Effort:** Medium

### 11. Preconnect Hints
- **Action:** Add `<link rel="preconnect">` for critical third-party domains
- **Impact:** Low — marginal CWV improvement
- **Effort:** Low

### 12. Organization SameAs Links
- **Action:** Add social media URLs to Organization JSON-LD
- **Status:** Deferred — Facebook group just created, waiting for content
- **Impact:** Low
- **Effort:** Low

### 13. Improve Show Page Titles & Meta Descriptions
- **Action:** Optimize title tags to better match `[show name] ביקורת` search pattern
- **Targets:** Direct improvement of #1 traffic source
- **Impact:** HIGH — 538 queries already driving traffic, better titles = higher CTR
- **Effort:** Low

### 14. Improve Home Page CTR for "הצגות מומלצות"
- **Action:** Optimize meta description to be more compelling for this query (30 impressions, 1 click)
- **Impact:** Medium
- **Effort:** Low

---

## Implementation Order (Recommended)

Phase 1 (Quick wins):
- [x] #13 — Improve show page titles/meta descriptions ✅ 2026-03-18
- [x] #14 — Improve home page meta for "הצגות מומלצות" ✅ 2026-03-18
- [x] #1 — Improve FAQ questions ✅ 2026-03-18
- [x] #3 — Events page OG image ✅ 2026-03-18
- [x] #8 — Optimize fallback image (PNG 1.6MB → WebP 96KB) ✅ 2026-03-18
- [x] #9 — Pagination hints (rel prev/next on /shows) ✅ 2026-03-18
- [x] #11 — Preconnect hints ✅ 2026-03-18 (N/A — no external domains to preconnect)

Phase 2 (New pages):
- [x] #4 — Theatre pages ✅ 2026-03-18 (includes #2 TheaterGroup structured data)
- [x] #5 — Genre pages ✅ 2026-03-18
- [ ] #10 — City pages

Phase 3 (Content & advanced):
- [ ] #6 — Blog/content section
- [ ] #7 — Dedicated review pages
- [x] #2 — TheaterGroup structured data ✅ 2026-03-18 (done as part of #4)
- [ ] #12 — Organization SameAs links (deferred — Facebook group just created)
