import prisma from "../prisma";
import { normalizeShow, showInclude } from "../showHelpers";
import type { Show } from "@/types";

/**
 * Get a single show by its slug, including genres and reviews.
 */
export async function getShowBySlug(slug: string): Promise<Show | null> {
  if (!slug) return null;

  const show = await prisma.show.findUnique({
    where: { slug },
    include: showInclude,
  });
  return normalizeShow(show);
}

/**
 * Get a single show by its numeric ID, including genres and reviews.
 * Used for backward compatibility (301 redirects from old numeric URLs).
 */
export async function getShowById(
  showId: string | number,
): Promise<Show | null> {
  const numericId = Number(showId);
  if (Number.isNaN(numericId) || numericId <= 0) return null;

  const show = await prisma.show.findUnique({
    where: { id: numericId },
    include: showInclude,
  });
  return normalizeShow(show);
}
