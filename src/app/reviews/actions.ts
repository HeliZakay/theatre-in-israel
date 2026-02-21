"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { addReview, updateReviewByOwner, deleteReviewByOwner } from "@/lib/reviews";
import prisma from "@/lib/prisma";
import {
  createReviewSchema,
  updateReviewSchema,
  formatZodErrors,
} from "@/lib/reviewSchemas";
import { checkFieldsForProfanity } from "@/utils/profanityFilter";
import { checkReviewRateLimit, checkEditDeleteRateLimit } from "@/utils/reviewRateLimit";
import { requireActionAuth } from "@/utils/actionAuth";
import {
  actionSuccess,
  actionError,
  INTERNAL_ERROR_MESSAGE,
  type ActionResult,
} from "@/types/actionResult";

function revalidateAfterReviewChange(showId: number): void {
  revalidatePath(`/shows/${showId}`);
  revalidatePath("/shows");
  revalidatePath("/");
  revalidateTag("homepage", "max");
  revalidateTag("shows-list", "max");
}

export async function createReview(
  formData: FormData,
): Promise<ActionResult<{ showId: number }>> {
  try {
    const auth = await requireActionAuth("יש להתחבר כדי לכתוב ביקורת", {
      check: checkReviewRateLimit,
      message: (t) =>
        `יצרת יותר מדי ביקורות לאחרונה. נסה שוב בעוד ${t} דקות.`,
    });
    if (auth.error) return auth.error;
    const { session } = auth;

    const payload = Object.fromEntries(formData.entries());
    const result = createReviewSchema.safeParse(payload);
    if (!result.success) {
      return actionError(formatZodErrors(result.error));
    }

    const { showId, name, title, rating, text } = result.data;
    const authorName = session.user.name?.trim() || name?.trim() || "משתמש/ת";

    const profanityMessages: Record<string, string> = {
      title: "הכותרת מכילה שפה לא הולמת. אנא נסח.י מחדש.",
      text: "התגובה מכילה שפה לא הולמת. אנא נסח.י מחדש.",
      authorName: "השם מכיל שפה לא הולמת. אנא בחר.י שם אחר.",
    };
    const badField = checkFieldsForProfanity({ title, text, authorName });
    if (badField) {
      return actionError(profanityMessages[badField]);
    }

    const today = new Date().toISOString().slice(0, 10);
    await addReview(showId, {
      author: authorName,
      title,
      text,
      rating,
      date: today,
      userId: session.user.id,
    });

    revalidateAfterReviewChange(showId);

    return actionSuccess({ showId });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err) {
      if (err.code === "P2002") {
        return actionError("כבר כתבת ביקורת להצגה זו.");
      }
      if (err.code === "P2003") {
        return actionError("ההצגה לא נמצאה");
      }
    }
    return actionError(INTERNAL_ERROR_MESSAGE, err);
  }
}

export async function updateReview(
  reviewId: number,
  values: { title: string; rating: number; text: string },
): Promise<ActionResult<{ showId: number }>> {
  try {
    const auth = await requireActionAuth("יש להתחבר כדי לערוך ביקורת", {
      check: checkEditDeleteRateLimit,
      message: (t) =>
        `ביצעת יותר מדי עריכות לאחרונה. נסה שוב בעוד ${t} דקות.`,
    });
    if (auth.error) return auth.error;
    const { session } = auth;

    const result = updateReviewSchema.safeParse(values);
    if (!result.success) {
      return actionError(formatZodErrors(result.error));
    }

    const profanityMessages: Record<string, string> = {
      title: "הכותרת מכילה שפה לא הולמת. אנא נסח.י מחדש.",
      text: "התגובה מכילה שפה לא הולמת. אנא נסח.י מחדש.",
    };
    const badField = checkFieldsForProfanity({
      title: result.data.title,
      text: result.data.text,
    });
    if (badField) {
      return actionError(profanityMessages[badField]);
    }

    const updated = await updateReviewByOwner(reviewId, session.user.id, {
      title: result.data.title,
      text: result.data.text,
      rating: result.data.rating,
    });

    if (!updated) {
      return actionError("הביקורת לא נמצאה");
    }

    revalidateAfterReviewChange(updated.showId);

    return actionSuccess({ showId: updated.showId });
  } catch (err: unknown) {
    return actionError(INTERNAL_ERROR_MESSAGE, err);
  }
}

export async function deleteReview(
  reviewId: number,
): Promise<ActionResult<void>> {
  try {
    const auth = await requireActionAuth("יש להתחבר כדי למחוק ביקורת", {
      check: checkEditDeleteRateLimit,
      message: (t) =>
        `ביצעת יותר מדי עריכות לאחרונה. נסה שוב בעוד ${t} דקות.`,
    });
    if (auth.error) return auth.error;
    const { session } = auth;

    const reviewToDelete = await prisma.review.findFirst({
      where: { id: reviewId, userId: session.user.id },
      select: { showId: true },
    });

    const deleted = await deleteReviewByOwner(reviewId, session.user.id);
    if (!deleted) {
      return actionError("הביקורת לא נמצאה");
    }

    if (reviewToDelete) {
      revalidateAfterReviewChange(reviewToDelete.showId);
    }

    return actionSuccess(undefined);
  } catch (err: unknown) {
    return actionError(INTERNAL_ERROR_MESSAGE, err);
  }
}
