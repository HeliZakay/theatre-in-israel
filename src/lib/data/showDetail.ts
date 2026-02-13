import prisma from "../prisma";
import { normalizeShow, showInclude } from "../showHelpers";
import type { Show } from "@/types";

/**
 * Get a single show by its ID, including genres and reviews.
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
