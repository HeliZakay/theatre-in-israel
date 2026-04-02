import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getBatchShows,
  getReviewedShowIds,
  getAnonymousReviewedShowIds,
} from "@/lib/data/batchReview";
import BatchReviewFlow from "@/components/batch-review/BatchReviewFlow";
import ROUTES from "@/constants/routes";
import { SITE_NAME } from "@/lib/seo";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "דרגו הצגות שראיתם",
  description: "דרגו וכתבו ביקורות על הצגות שראיתם — בזריזות ובקלות.",
  robots: { index: false, follow: false },
  openGraph: {
    title: `דרגו הצגות שראיתם | ${SITE_NAME}`,
    description: "דרגו וכתבו ביקורות על הצגות שראיתם — בזריזות ובקלות.",
    url: ROUTES.REVIEWS_BATCH,
  },
};

export const dynamic = "force-dynamic";

export default async function BatchReviewPage() {
  const [session, headersList] = await Promise.all([
    getServerSession(authOptions),
    headers(),
  ]);

  const isAuthenticated = !!session;

  const [shows, reviewedShowIds] = await Promise.all([
    getBatchShows(),
    isAuthenticated
      ? getReviewedShowIds(session!.user!.id as string)
      : getAnonymousReviewedShowIds(
          headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            "unknown",
        ),
  ]);

  return (
    <BatchReviewFlow
      shows={shows}
      reviewedShowIds={reviewedShowIds}
      isAuthenticated={isAuthenticated}
    />
  );
}
