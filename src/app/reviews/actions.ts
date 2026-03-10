"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import {
  addReview,
  updateReviewByOwner,
  deleteReviewByOwner,
} from "@/lib/reviews";
import prisma from "@/lib/prisma";
import {
  createReviewSchema,
  updateReviewSchema,
  formatZodErrors,
} from "@/lib/reviewSchemas";
import { checkFieldsForProfanity } from "@/utils/profanityFilter";
import {
  checkReviewRateLimit,
  checkEditDeleteRateLimit,
  checkAnonymousReviewRateLimit,
} from "@/utils/reviewRateLimit";
import { requireActionAuth } from "@/utils/actionAuth";
import { getLotteryEntriesCount } from "@/lib/lottery";
import { isLotteryActive } from "@/constants/lottery";
import {
  actionSuccess,
  actionError,
  INTERNAL_ERROR_MESSAGE,
  type ActionResult,
} from "@/types/actionResult";
import { notifyNewReview } from "@/lib/email";

async function revalidateAfterReviewChange(showId: number): Promise<void> {
  const show = await prisma.show.findUnique({
    where: { id: showId },
    select: { slug: true },
  });
  if (show) {
    revalidatePath(`/shows/${show.slug}`);
  }
  revalidatePath("/shows");
  revalidatePath("/");
  revalidateTag("homepage", "max");
  revalidateTag("shows-list", "max");
}

export async function createReview(
  formData: FormData,
): Promise<
  ActionResult<{ showId: number; reviewCount: number; lotteryEntries?: number }>
> {
  try {
    const auth = await requireActionAuth("יש להתחבר כדי לכתוב ביקורת", {
      check: checkReviewRateLimit,
      message: (t) => `יצרת יותר מדי ביקורות לאחרונה. נס.י שוב בעוד ${t} דקות.`,
    });
    if (auth.error) return auth.error;
    const { session } = auth;

    const payload = Object.fromEntries(formData.entries());
    const result = createReviewSchema.safeParse(payload);
    if (!result.success) {
      return actionError(formatZodErrors(result.error));
    }

    const { showId, name, rating, text } = result.data;
    const authorName = session.user.name?.trim() || name?.trim() || "משתמש/ת";

    // When title is empty, fall back to the show name
    let title = result.data.title?.trim() || "";
    if (!title) {
      const showForTitle = await prisma.show.findUnique({
        where: { id: showId },
        select: { title: true },
      });
      title = showForTitle?.title ?? `הצגה #${showId}`;
    }

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

    await revalidateAfterReviewChange(showId);

    const show = await prisma.show.findUnique({
      where: { id: showId },
      select: { title: true, reviewCount: true },
    });
    notifyNewReview({
      authorName,
      showTitle: show?.title ?? `הצגה #${showId}`,
      rating,
      title,
      text,
      isAnonymous: false,
    }).catch(console.error);

    const reviewCount = show?.reviewCount ?? 1;

    if (isLotteryActive()) {
      const lotteryEntries = await getLotteryEntriesCount(session.user.id);
      return actionSuccess({ showId, reviewCount, lotteryEntries });
    }

    return actionSuccess({ showId, reviewCount });
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

export async function createAnonymousReview(
  formData: FormData,
): Promise<ActionResult<{ showId: number; reviewCount: number }>> {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const payload = Object.fromEntries(formData.entries());

    // Silent bot rejection: if honeypot is filled, pretend success
    if (payload.honeypot) {
      const showId = Number(payload.showId) || 0;
      return actionSuccess({ showId, reviewCount: 1 });
    }

    const rateLimit = await checkAnonymousReviewRateLimit(ip);
    if (rateLimit.isLimited) {
      return actionError("יצרת יותר מדי ביקורות לאחרונה. נס.י שוב מאוחר יותר.");
    }

    const result = createReviewSchema.safeParse(payload);
    if (!result.success) {
      return actionError(formatZodErrors(result.error));
    }

    const { showId, name, rating, text } = result.data;
    const authorName = name?.trim() || "אנונימי";

    // When title is empty, fall back to the show name
    let title = result.data.title?.trim() || "";
    if (!title) {
      const showForTitle = await prisma.show.findUnique({
        where: { id: showId },
        select: { title: true },
      });
      title = showForTitle?.title ?? `הצגה #${showId}`;
    }

    const profanityMessages: Record<string, string> = {
      title: "הכותרת מכילה שפה לא הולמת. אנא נסח.י מחדש.",
      text: "התגובה מכילה שפה לא הולמת. אנא נסח.י מחדש.",
      authorName: "השם מכיל שפה לא הולמת. אנא בחר.י שם אחר.",
    };
    const badField = checkFieldsForProfanity({ title, text, authorName });
    if (badField) {
      return actionError(profanityMessages[badField]);
    }

    // IP-based dedup: one anonymous review per IP per show
    const existingAnonymousReview = await prisma.review.findFirst({
      where: { ip, showId, userId: null },
      select: { id: true },
    });
    if (existingAnonymousReview) {
      return actionError("כבר כתבת ביקורת להצגה זו.");
    }

    const today = new Date().toISOString().slice(0, 10);
    await addReview(showId, {
      author: authorName,
      title,
      text,
      rating,
      date: today,
      ip,
    });

    await revalidateAfterReviewChange(showId);

    const show = await prisma.show.findUnique({
      where: { id: showId },
      select: { title: true, reviewCount: true },
    });
    notifyNewReview({
      authorName,
      showTitle: show?.title ?? `הצגה #${showId}`,
      rating,
      title,
      text,
      isAnonymous: true,
    }).catch(console.error);

    const reviewCount = show?.reviewCount ?? 1;

    return actionSuccess({ showId, reviewCount });
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
      message: (t) => `ביצעת יותר מדי עריכות לאחרונה. נס.י שוב בעוד ${t} דקות.`,
    });
    if (auth.error) return auth.error;
    const { session } = auth;

    const result = updateReviewSchema.safeParse(values);
    if (!result.success) {
      return actionError(formatZodErrors(result.error));
    }

    // When title is empty, fall back to the show name
    let title = result.data.title?.trim() || "";
    if (!title) {
      const reviewForShow = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { show: { select: { title: true } } },
      });
      title = reviewForShow?.show?.title ?? "ביקורת";
    }

    const profanityMessages: Record<string, string> = {
      title: "הכותרת מכילה שפה לא הולמת. אנא נסח.י מחדש.",
      text: "התגובה מכילה שפה לא הולמת. אנא נסח.י מחדש.",
    };
    const badField = checkFieldsForProfanity({
      title,
      text: result.data.text,
    });
    if (badField) {
      return actionError(profanityMessages[badField]);
    }

    const updated = await updateReviewByOwner(reviewId, session.user.id, {
      title,
      text: result.data.text,
      rating: result.data.rating,
    });

    if (!updated) {
      return actionError("הביקורת לא נמצאה");
    }

    await revalidateAfterReviewChange(updated.showId);

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
      message: (t) => `ביצעת יותר מדי עריכות לאחרונה. נס.י שוב בעוד ${t} דקות.`,
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
      await revalidateAfterReviewChange(reviewToDelete.showId);
    }

    return actionSuccess(undefined);
  } catch (err: unknown) {
    return actionError(INTERNAL_ERROR_MESSAGE, err);
  }
}
