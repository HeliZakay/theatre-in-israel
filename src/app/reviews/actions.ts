/**
 * Server Actions for review CRUD.
 *
 * Validation pipeline (in order):
 *   1. Auth check (session required for signed-in flow)
 *   2. Rate limit (per-user or per-IP)
 *   3. Zod schema validation
 *   4. Profanity filter (Hebrew + English)
 *   5. Business rules (cookie dedup for anonymous, unique constraint for signed-in)
 */
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { getOrCreateAnonToken } from "@/utils/anonToken";
import { getClientIp } from "@/utils/getClientIp";
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
import { checkReviewRateLimit } from "@/utils/reviewRateLimit";
import {
  checkEditDeleteRateLimit,
  checkAnonymousReviewRateLimit,
} from "@/utils/rateLimitCheckers";
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
import { isPrismaError } from "@/utils/prismaError";

const PROFANITY_MESSAGES: Record<string, string> = {
  title: "הכותרת מכילה שפה לא הולמת. אנא נסח.י מחדש.",
  text: "התגובה מכילה שפה לא הולמת. אנא נסח.י מחדש.",
  authorName: "השם מכיל שפה לא הולמת. אנא בחר.י שם אחר.",
};

async function resolveReviewTitle(
  rawTitle: string | undefined,
  lookupShowTitle: () => Promise<string | null | undefined>,
  fallback: string,
): Promise<string> {
  const title = rawTitle?.trim() || "";
  if (title) return title;
  const showTitle = await lookupShowTitle();
  return showTitle ?? fallback;
}

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

    const title = await resolveReviewTitle(
      result.data.title,
      async () => {
        const s = await prisma.show.findUnique({ where: { id: showId }, select: { title: true } });
        return s?.title;
      },
      `הצגה #${showId}`,
    );

    const badField = checkFieldsForProfanity({ title, text, authorName });
    if (badField) {
      return actionError(PROFANITY_MESSAGES[badField]);
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
    }).catch((err) => console.error("[Email]", err));

    const reviewCount = show?.reviewCount ?? 1;

    if (isLotteryActive()) {
      const lotteryEntries = await getLotteryEntriesCount(session.user.id);
      return actionSuccess({ showId, reviewCount, lotteryEntries });
    }

    return actionSuccess({ showId, reviewCount });
  } catch (err: unknown) {
    // Prisma error codes: P2002 = unique constraint violation (duplicate review),
    // P2003 = foreign key violation (show doesn't exist).
    if (isPrismaError(err)) {
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
    const ip = getClientIp(headersList);

    const payload = Object.fromEntries(formData.entries());

    // Honeypot field: bots fill hidden fields, humans don't. Return fake
    // success so the bot doesn't know it was detected.
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

    const title = await resolveReviewTitle(
      result.data.title,
      async () => {
        const s = await prisma.show.findUnique({ where: { id: showId }, select: { title: true } });
        return s?.title;
      },
      `הצגה #${showId}`,
    );

    const badField = checkFieldsForProfanity({ title, text, authorName });
    if (badField) {
      return actionError(PROFANITY_MESSAGES[badField]);
    }

    // Cookie-based dedup: one anonymous review per browser per show.
    // Admin bypass cookie lets admins test the flow without being blocked.
    const anonToken = await getOrCreateAnonToken();
    const bypassToken = process.env.ADMIN_BYPASS_TOKEN;
    const cookieStore = await cookies();
    const hasAdminBypass =
      bypassToken && cookieStore.get("admin_bypass")?.value === bypassToken;

    if (!hasAdminBypass) {
      const existingAnonymousReview = await prisma.review.findFirst({
        where: { anonToken, showId, userId: null },
        select: { id: true },
      });
      if (existingAnonymousReview) {
        return actionError("כבר כתבת ביקורת להצגה זו.");
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    await addReview(showId, {
      author: authorName,
      title,
      text,
      rating,
      date: today,
      ip,
      anonToken,
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
    }).catch((err) => console.error("[Email]", err));

    const reviewCount = show?.reviewCount ?? 1;

    return actionSuccess({ showId, reviewCount });
  } catch (err: unknown) {
    if (isPrismaError(err)) {
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

    const title = await resolveReviewTitle(
      result.data.title,
      async () => {
        const r = await prisma.review.findUnique({
          where: { id: reviewId },
          select: { show: { select: { title: true } } },
        });
        return r?.show?.title;
      },
      "ביקורת",
    );

    const badField = checkFieldsForProfanity({
      title,
      text: result.data.text,
    });
    if (badField) {
      return actionError(PROFANITY_MESSAGES[badField]);
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
