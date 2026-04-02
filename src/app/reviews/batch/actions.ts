"use server";

import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getReviewedShowIds,
  getAnonymousReviewedShowIds,
} from "@/lib/data/batchReview";

/**
 * Re-fetch already-reviewed show IDs from the server.
 * Called by the "Review more" button on the exit summary
 * so Step 1 can grey out newly-reviewed shows.
 */
export async function refetchReviewedIds(): Promise<number[]> {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    return getReviewedShowIds(session.user.id as string);
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return getAnonymousReviewedShowIds(ip);
}
