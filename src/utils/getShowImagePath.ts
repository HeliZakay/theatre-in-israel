/**
 * Convert a show title to its corresponding image path in /public.
 * Image filenames use dashes instead of spaces and Hebrew geresh (׳)
 * instead of regular apostrophes (').
 *
 * @param {string} title – the show title
 * @returns {string} public image path, e.g. "/קזבלן.webp"
 */
export function getShowImagePath(title: string): string {
  const slug = title.replace(/\s+/g, "-").replace(/'/g, "\u05F3"); // replace ASCII apostrophe with Hebrew geresh ׳

  return `/${slug}.webp`;
}
