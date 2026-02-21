# SEO — Future Improvements

Improvements that can further strengthen the site's search engine performance, ordered by impact.

---

## High Impact

### 1. Custom Domain (`.co.il`)

Buy a `.co.il` domain (e.g. `theatre-israel.co.il`, `bikorot-theatre.co.il`).

**Why:**

- The `vercel.app` subdomain shares domain authority with every other Vercel project
- A `.co.il` ccTLD gives a strong geo-relevance boost in Google Israel
- Builds your own backlink equity over time
- Looks professional — improves click-through rate from search results
- Portable — you can move hosting without losing SEO

**Steps:**

1. Purchase domain from a `.co.il` registrar
2. Add it in Vercel Dashboard → Settings → Domains (Vercel auto-provisions SSL)
3. Update the `NEXT_PUBLIC_SITE_URL` env variable
4. Set up 301 redirects from the old `vercel.app` URL (Vercel handles this automatically when a custom domain is configured)

### 2. URL Slugs Instead of Numeric IDs

Change `/shows/42` → `/shows/42/קברט` or `/shows/קברט`.

**Why:**

- URLs with keywords rank better — Google uses URL tokens as relevance signals
- Improves click-through rate — users see the show name in the URL
- Hebrew slugs work fine in modern browsers and Google indexes them properly

**Steps:**

1. Add a `slug` field to the `Show` model in `prisma/schema.prisma`
2. Write a migration to generate slugs from existing titles (handle duplicates)
3. Update all link generation (`ShowCard`, `FeaturedShow`, `sitemap.ts`, etc.)
4. Add 301 redirects from old `/shows/:id` to `/shows/:slug`
5. Update canonical URLs and JSON-LD `mainEntityOfPage`

### 3. Google Search Console Setup

Required for monitoring indexing, crawl errors, and search performance.

**Steps:**

1. Verify domain ownership (DNS TXT record or HTML meta tag)
2. Add `verification.google` to root metadata in `layout.tsx`
3. Submit `/sitemap.xml`
4. Request indexing for `/`, `/shows`, and top show pages
5. See `SEO_SEARCH_CONSOLE_CHECKLIST.md` for full walkthrough

---

## Medium Impact

### 4. Visible Breadcrumb UI Component

JSON-LD breadcrumbs exist but there's no visible breadcrumb trail on show pages.

**Why:**

- Google prefers breadcrumbs that match between visible UI and structured data
- Improves user navigation — especially for show detail pages
- May appear as rich breadcrumbs in search results

**Steps:**

1. Create a `Breadcrumb` component rendering `Home > הצגות > Show Title`
2. Add it to `/shows` and `/shows/[id]` pages
3. Style it with RTL support

### 5. `updatedAt` Field on Show Model

The sitemap currently uses the latest review date as `lastModified`. An explicit `updatedAt` on the Show model would be more accurate.

**Why:**

- Show data (description, metadata) may change independently of reviews
- More accurate signals help search engines prioritize re-crawling

**Steps:**

1. Add `updatedAt DateTime @updatedAt` to the `Show` model
2. Run a migration
3. Update `sitemap.ts` to use `max(show.updatedAt, latestReviewDate)`

### 6. Bing Webmaster Tools

Free secondary search engine coverage.

**Steps:**

1. Create account at [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Verify domain
3. Submit sitemap
4. Add `verification.bing` to root metadata

### 7. Build Backlinks

Crucial for domain authority, especially with a new domain.

**Ideas:**

- Submit to Israeli theatre directories and aggregators
- Reach out to Israeli culture blogs and magazines
- Share on theatre Facebook groups and forums
- Get listed on Israeli cultural event sites
- Contact theatre companies to link to their show pages on your site

---

## Low Impact / Nice-to-Have

### 8. Twitter Cards on All Indexable Pages

Currently only the root layout and show detail pages define Twitter card metadata. The shows listing and homepage inherit the root logo.

**Steps:**

- Add `twitter` metadata with contextual images to `src/app/shows/page.tsx` and `src/app/page.tsx`

### 9. Meta Description from `description` Field

Show detail meta descriptions currently use the `summary` field. The longer `description` field has richer content.

**Steps:**

- In `buildShowDescription()` in `src/app/shows/[id]/page.tsx`, prefer `description` over `summary` when available, truncated to ~155 characters

### 10. English Version / Multi-Language Support

Expands audience to tourists, expats, and international theatre fans.

**Why:**

- Israel has a significant English-speaking audience (tourists, Anglo community)
- International backlinks are easier to build in English
- Would require `hreflang` tags (self-referencing `he` already added)

**Steps:**

1. Choose an i18n framework (`next-intl` recommended for App Router)
2. Create `/en` locale routes
3. Translate UI strings and show content
4. Add `hreflang` alternates between Hebrew and English versions

### 11. Review Pagination

All reviews for a show load at once. For shows with many reviews, consider:

- Server-side pagination or "load more"
- Helps with page weight and initial load time
- Not a direct SEO factor but improves Core Web Vitals

### 12. Open Graph Images Per Section

Generate dynamic OG images for the shows listing page (collage of top shows) instead of the generic logo. Next.js supports `opengraph-image.tsx` for dynamic OG image generation.

---

## Already Implemented ✅

For reference, these SEO features are already in place:

- Per-page `<title>` and `<meta description>` on all routes
- `metadataBase` configured for absolute URL resolution
- Canonical URLs on all indexable pages
- OpenGraph metadata (type, locale, siteName, images)
- Twitter card on root layout + show detail pages
- JSON-LD: WebSite (with SearchAction), Organization, BreadcrumbList, ItemList, CreativeWork with AggregateRating + Reviews
- `robots.txt` blocking API routes, auth pages, user pages, and form pages
- Dynamic sitemap from database with per-show `lastModified` from latest review
- Smart `noindex` for filtered/paginated/search results
- `<html lang="he" dir="rtl">` throughout
- `font-display: swap` on web font
- `priority` hint on above-the-fold images
- All images in WebP via `next/image` with responsive `sizes`
- Semantic HTML (`<main>`, `<header>`, `<footer>`, `<nav>`, `<article>`, `<section>`)
- Proper heading hierarchy (single `<h1>` per page)
- Comprehensive ARIA attributes on all interactive elements
- Skip-to-content link
- Favicon, icon.png, apple-touch-icon, and web app manifest
- `generateStaticParams` for show detail pages
- Viewport meta with `themeColor`
- Self-referencing `hreflang` for Hebrew
- Security headers (HSTS, CSP, X-Frame-Options, Referrer-Policy)
