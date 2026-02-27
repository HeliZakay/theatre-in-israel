"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { updateProfileSchema, formatZodErrors } from "@/lib/profileSchemas";
import { checkFieldsForProfanity } from "@/utils/profanityFilter";
import { checkProfileRateLimit } from "@/utils/profileRateLimit";
import { requireActionAuth } from "@/utils/actionAuth";
import {
  actionSuccess,
  actionError,
  INTERNAL_ERROR_MESSAGE,
  type ActionResult,
} from "@/types/actionResult";

/**
 * Update the user's display name.
 * Also bulk-updates Review.author for all existing reviews by this user.
 */
export async function updateProfile(values: {
  name: string;
}): Promise<ActionResult<{ name: string }>> {
  try {
    const auth = await requireActionAuth("יש להתחבר כדי לעדכן פרופיל", {
      check: checkProfileRateLimit,
      message: (t) =>
        `ביצעת יותר מדי עדכונים לאחרונה. נס.י שוב בעוד ${t} דקות.`,
    });
    if (auth.error) return auth.error;
    const { session } = auth;

    const result = updateProfileSchema.safeParse(values);
    if (!result.success) {
      return actionError(formatZodErrors(result.error));
    }

    const { name } = result.data;

    // Profanity check
    const badField = checkFieldsForProfanity({ name });
    if (badField) {
      return actionError("השם מכיל שפה לא הולמת. אנא בחר.י שם אחר.");
    }

    // Update user name + bulk-update review authors in a transaction
    const affectedShowIds = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: { name },
      });

      // Get all show IDs of the user's reviews before updating
      const reviews = await tx.review.findMany({
        where: { userId: session.user.id },
        select: { showId: true },
        distinct: ["showId"],
      });

      // Bulk-update author name on all user's reviews
      await tx.review.updateMany({
        where: { userId: session.user.id },
        data: { author: name },
      });

      return reviews.map((r) => r.showId);
    });

    // Revalidate affected paths
    if (affectedShowIds.length > 0) {
      const shows = await prisma.show.findMany({
        where: { id: { in: affectedShowIds } },
        select: { slug: true },
      });
      for (const show of shows) {
        revalidatePath(`/shows/${show.slug}`);
      }
    }

    revalidatePath("/me");
    revalidatePath("/me/reviews");
    revalidatePath("/shows");
    revalidatePath("/");
    revalidateTag("homepage", "max");
    revalidateTag("shows-list", "max");

    return actionSuccess({ name });
  } catch (err: unknown) {
    return actionError(INTERNAL_ERROR_MESSAGE, err);
  }
}
