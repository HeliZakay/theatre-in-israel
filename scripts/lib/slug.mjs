/**
 * Generate a URL-safe slug from a show title.
 *
 * Keeps Hebrew characters intact for SEO, replaces spaces with hyphens,
 * and normalises special characters (e.g. ASCII apostrophe → Hebrew geresh ׳).
 *
 * @note Canonical source: src/utils/generateSlug.ts — keep in sync.
 *
 * @param {string} title
 * @returns {string}
 *
 * @example generateSlug("קברט") → "קברט"
 * @example generateSlug("צ'ילבות") → "צ׳ילבות"
 * @example generateSlug("מה קרה לעולם?") → "מה-קרה-לעולם"
 */
export function generateSlug(title) {
  return title
    .trim()
    .replace(/\s+/g, "-")
    .replace(/'/g, "\u05F3")
    .replace(/[?#%|\\/:*"<>]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
