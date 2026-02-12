# Google Search Console Checklist

Use this checklist after deploying the latest SEO changes.

## 1) Pre-check before Search Console

1. Deploy latest code to production.
2. In Vercel, set `NEXT_PUBLIC_SITE_URL` to your real domain (example: `https://yourdomain.co.il`).
3. Open and verify these URLs load:
   - `https://yourdomain.co.il/robots.txt`
   - `https://yourdomain.co.il/sitemap.xml`

## 2) Verify Domain Property in Search Console

1. Go to `https://search.google.com/search-console`.
2. Click property selector (top-left) -> `+ Add property`.
3. Choose **Domain** (not URL-prefix).
4. Enter only the domain, e.g. `yourdomain.co.il` (no `https://`, no path).
5. Copy the DNS TXT record Google gives (`google-site-verification=...`).
6. Add that TXT record at your DNS provider.
7. Wait a few minutes, then click **Verify**.
8. If it fails, wait and retry (DNS propagation can take time).
9. Keep the TXT record permanently.

## 3) Submit sitemap

1. Open the verified property in Search Console.
2. Go to **Sitemaps**.
3. Submit `https://yourdomain.co.il/sitemap.xml`.
4. Confirm status becomes `Success` (or fix any error shown).

## 4) Request indexing for key pages

1. Use the URL Inspection bar.
2. Inspect and request indexing for:
   - `https://yourdomain.co.il/`
   - `https://yourdomain.co.il/shows`
   - 5-10 top show pages.
3. For each URL:
   - Click **Test live URL**.
   - Confirm no blocking issue.
   - Click **Request indexing**.

## 5) Check indexability

1. Open **Pages** report in Search Console.
2. Review reasons under “Not indexed”.
3. Ensure key pages are not blocked by `noindex` or `robots.txt`.
4. Expected and OK to remain non-indexed:
   - `/reviews/new`
   - `/shows/[id]/review`

## 6) Confirm robots/sitemap after deploy

1. `robots.txt` must be publicly reachable.
2. It must include sitemap reference to `/sitemap.xml`.
3. `sitemap.xml` must load and include URLs.
4. If Search Console says “Couldn’t fetch”, re-check URL, redirects, and access.

## 7) Timeline expectations

1. Search Console data usually starts showing in a few days.
2. Indexing requests can take from days up to 1-2 weeks.
3. Re-check progress after 7 days and again after 14 days.

## Official references

- Add property: `https://support.google.com/webmasters/answer/34592`
- Verify ownership (DNS): `https://support.google.com/webmasters/answer/9008080`
- Submit sitemap: `https://support.google.com/webmasters/answer/7451001`
- URL Inspection / request indexing: `https://support.google.com/webmasters/answer/9012289`
- Page indexing report: `https://support.google.com/webmasters/answer/7440203`
