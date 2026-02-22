/**
 * Convert a show title into a URL-safe slug.
 *
 * Slugs keep Hebrew characters intact for SEO, replace spaces with hyphens,
 * and normalise special characters (e.g. ASCII apostrophe → Hebrew geresh ׳).
 *
 * @example generateSlug("קברט") → "קברט"
 * @example generateSlug("צ'ילבות") → "צ׳ילבות"
 * @example generateSlug("מה קרה לעולם?") → "מה-קרה-לעולם"
 */
export function generateSlug(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, "-")
    .replace(/'/g, "\u05F3")
    .replace(/[?#%|\\/:*"<>]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
