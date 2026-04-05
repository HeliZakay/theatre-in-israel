"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getReviewedShowIds,
  getAnonymousReviewedShowIds,
} from "@/lib/data/batchReview";
import { getAnonToken } from "@/utils/anonToken";

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

  const anonToken = await getAnonToken();
  return anonToken ? getAnonymousReviewedShowIds(anonToken) : [];
}
