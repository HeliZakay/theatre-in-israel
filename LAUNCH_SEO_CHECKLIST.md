# Launch & SEO Checklist

Step-by-step instructions for taking the site live and getting it indexed.

---

## Step 1: Buy a Custom Domain ✅

> **Completed Feb 22, 2026** — Domain `theatre-in-israel.co.il` purchased via Internic. DNS configured (A → `216.198.79.1`, CNAME www → `f7d9d90643e4bfa4.vercel-dns-017.com`). SSL provisioned. `NEXT_PUBLIC_SITE_URL` updated and redeployed.

**Goal:** Get a `.co.il` domain (e.g., `theatre.co.il`) so the site has a real address.

1. Go to a domain registrar that sells `.co.il` domains:
   - [Israel Domains (isoc.org.il)](https://domains.isoc.org.il/)
   - Or international registrars like [Namecheap](https://www.namecheap.com/) / [GoDaddy](https://www.godaddy.com/)
2. Search for an available domain name and purchase it.
3. Go to your **Vercel Dashboard** → select your project → **Settings** → **Domains**.
4. Click **"Add"** and type your new domain (e.g., `theatre.co.il`).
5. Vercel will show you DNS records to configure. Go to your domain registrar's DNS settings and add them:
   - Usually an **A record** pointing to `76.76.21.21`
   - And a **CNAME record** for `www` pointing to `cname.vercel-dns.com`
6. Wait a few minutes for DNS to propagate. Vercel will auto-provision **SSL** (HTTPS).
7. In Vercel → **Settings** → **Environment Variables**, update `NEXT_PUBLIC_SITE_URL` to your new domain (e.g., `https://theatre.co.il`).
8. **Redeploy** the project so the new URL takes effect.

---

## Step 2: Set Up Google Search Console ✅

> **Completed Feb 22, 2026** — Property `theatre-in-israel.co.il` verified via DNS TXT record. Verification meta tag also added to `layout.tsx` as backup.

**Goal:** Tell Google your site exists and get access to search performance data.

1. Go to [Google Search Console](https://search.google.com/search-console/).
2. Sign in with your Google account.
3. Click **"Add Property"** → choose **"Domain"** type → enter your domain (e.g., `theatre.co.il`).
4. Google will give you a **DNS TXT record** to verify ownership. It looks like:
   ```
   google-site-verification=XXXXXXXXXXXXXXXXXXXX
   ```
5. Go to your domain registrar's DNS settings → add a **TXT record** with that value.
6. Go back to Search Console and click **"Verify"**. It may take a few minutes.
7. Once verified, copy the verification code (just the `XXXXXXXXXXXXXXXXXXXX` part).
8. **Let me know the code** — I'll add it to the site's metadata so Google can also verify via the HTML tag.

---

## Step 3: Submit Sitemap to Search Console ✅

> **Completed Feb 22, 2026** — Sitemap submitted at `https://theatre-in-israel.co.il/sitemap.xml`. Initially showed "Couldn't fetch" (DNS propagation delay) — will resolve automatically.

**Goal:** Tell Google about all the pages on your site so it can crawl them.

1. Open [Google Search Console](https://search.google.com/search-console/).
2. Select your property (domain) from the dropdown at the top left.
3. In the left sidebar, click **"Sitemaps"**.
4. In the **"Add a new sitemap"** field, type:
   ```
   https://yourdomain.co.il/sitemap.xml
   ```
   (Replace `yourdomain.co.il` with your actual domain.)
5. Click **"Submit"**.
6. The status should change to **"Success"** within a few minutes. If it says "Couldn't fetch," wait and retry — DNS may still be propagating.

---

## Step 4: Request Indexing for Key Pages ✅

> **Completed Feb 22, 2026** — Indexing requested for homepage and `/shows`.

**Goal:** Ask Google to prioritize crawling your most important pages.

1. In Google Search Console, use the **URL Inspection** tool (search bar at the top).
2. Paste each of these URLs one at a time:
   - `https://yourdomain.co.il/`
   - `https://yourdomain.co.il/shows`
   - Your top show pages (e.g., `https://yourdomain.co.il/shows/1`, `https://yourdomain.co.il/shows/2`, etc.)
3. For each URL:
   - Wait for the inspection to finish.
   - If it says **"URL is not on Google"**, click **"Request Indexing"**.
   - If it says **"URL is on Google"**, you're good — no action needed.
4. Note: Google limits indexing requests, so focus on your **5–10 most important pages**.

---

## Step 5: Validate Structured Data ✅

> **Completed Feb 22, 2026** — Validated via Schema Markup Validator. Homepage: `Organization` + `WebSite` (0 errors). Show page: `Organization` + `BreadcrumbList` + `CreativeWork` + `WebSite` (0 errors).

**Goal:** Make sure Google can read the structured data (schemas) on your pages correctly.

1. Go to [Google Rich Results Test](https://search.google.com/test/rich-results).
2. Enter your **homepage URL** (e.g., `https://yourdomain.co.il/`) and click **"Test URL"**.
3. Check that these schemas are detected **without errors**:
   - ✅ `WebSite`
   - ✅ `Organization`
4. Now test a **show detail page** (e.g., `https://yourdomain.co.il/shows/1`).
5. Check that these schemas are detected **without errors**:
   - ✅ `BreadcrumbList`
   - ✅ `CreativeWork`
   - ✅ `AggregateRating` (if the show has reviews)
6. If there are **warnings** (yellow), that's usually fine. Fix any **errors** (red).
7. You can also use [Schema Markup Validator](https://validator.schema.org/) for a more detailed view.

---

## Step 6: Test Core Web Vitals

**Goal:** Make sure the site loads fast and provides a good user experience.

1. Go to [PageSpeed Insights](https://pagespeed.web.dev/).
2. Enter your homepage URL and click **"Analyze"**.
3. Check the scores for both **Mobile** and **Desktop**:
   - **LCP (Largest Contentful Paint)** — should be under **2.5 seconds** (green).
   - **CLS (Cumulative Layout Shift)** — should be under **0.1** (green).
   - **INP (Interaction to Next Paint)** — should be under **200ms** (green).
4. If any metric is yellow or red, look at the **"Diagnostics"** section for suggestions.
5. Common fixes:
   - Optimize images (use WebP, proper sizing).
   - Reduce unused JavaScript.
   - Ensure fonts load with `font-display: swap` (already done ✅).
6. Re-test after any changes.

---

## Step 7: Set Up Bing Webmaster Tools

**Goal:** Get your site indexed on Bing/Yahoo too (free and easy).

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters/).
2. Sign in with a Microsoft account (or create one).
3. Click **"Add Site"** → enter your domain.
4. Choose verification method:
   - **Easiest:** Select **"Import from Google Search Console"** if you already set that up — it pulls everything automatically.
   - **Alternative:** Add a DNS CNAME record as instructed.
5. Once verified, go to **"Sitemaps"** in the sidebar.
6. Submit your sitemap URL:
   ```
   https://yourdomain.co.il/sitemap.xml
   ```
7. Done! Bing will start crawling your site.

---

## Step 8: Build Backlinks

**Goal:** Get other websites to link to yours — this boosts SEO significantly.

**Where to reach out:**

1. **Israeli theatre communities:**
   - Facebook groups about Israeli theatre (e.g., "תיאטרון ישראלי", "מה לראות בתיאטרון").
   - Share your site as a useful resource for finding shows and reading reviews.

2. **Culture blogs and media:**
   - Israeli culture blogs, entertainment sites, or local news outlets.
   - Pitch them: "We built a free review site for Israeli theatre — would you be interested in mentioning it?"

3. **Theatre companies directly:**
   - Contact theatres (Habima, Cameri, Beit Lessin, etc.) and ask if they'd link to your review pages.
   - Offer to feature their shows prominently.

4. **Social media:**
   - Share on Twitter/X, Instagram, and relevant Reddit communities.
   - Create a Google Business Profile if applicable.

**Tips:**

- Links from `.co.il` domains are especially valuable for ranking in Israel.
- Quality matters more than quantity — one link from a respected culture site > ten random links.
- Don't buy links or use link farms — Google penalizes this.

---

## Step 9: Monitor Coverage in Search Console

**Goal:** Check that Google is indexing your pages correctly after 1–2 weeks.

1. Open [Google Search Console](https://search.google.com/search-console/).
2. In the left sidebar, click **"Pages"** (under "Indexing").
3. You'll see a chart showing:
   - **Indexed pages** (green) — these are live on Google. ✅
   - **Not indexed pages** (gray) — click here to see why.
4. **What to look for:**
   - Your public pages (`/`, `/shows`, `/shows/[id]`, `/reviews`) should show as **"Indexed"**.
   - Auth and form pages (`/auth/login`, `/auth/register`, `/me/*`) should show as **"Excluded by 'noindex' tag"** — this is correct and expected. ✅
   - If important pages show **"Discovered – currently not indexed"** or **"Crawled – currently not indexed"**, request indexing again (Step 4).
5. Check the **"Why pages aren't indexed"** section for any errors like:
   - "Server error (5xx)" — your site had a server error when Google tried to crawl it.
   - "Redirect error" — a redirect loop or broken redirect.
   - "Soft 404" — page returns 200 but looks empty to Google.
6. Fix any errors and re-request indexing.
7. **Repeat this check** monthly to maintain good indexing health.

---

## Quick Reference / Timeline

| When                | What to Do                              |
| ------------------- | --------------------------------------- |
| **Now**             | ~~Step 1: Buy domain~~ ✅               |
| **Right after**     | ~~Step 2: Set up Search Console~~ ✅    |
| **Same day**        | ~~Step 3: Submit sitemap~~ ✅           |
| **Same day**        | ~~Step 4: Request indexing~~ ✅         |
| **Same day**        | ~~Step 5: Validate structured data~~ ✅ |
| **Same day**        | Step 7: Set up Bing Webmaster Tools     |
| **After deploy**    | Step 6: Test Core Web Vitals            |
| **Ongoing**         | Step 8: Build backlinks                 |
| **After 1–2 weeks** | Step 9: Monitor coverage                |
