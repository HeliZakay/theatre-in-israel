import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteReviewByOwner, updateReviewByOwner } from "@/lib/shows";
import { updateReviewSchema, formatZodErrors } from "@/constants/reviewSchemas";
import { containsProfanity } from "@/utils/profanityFilter";
import { checkEditDeleteRateLimit } from "@/utils/reviewRateLimit";
import {
  apiError,
  apiSuccess,
  INTERNAL_ERROR_MESSAGE,
} from "@/utils/apiResponse";

interface ReviewRouteContext {
  params: Promise<{ id: string }>;
}

function toReviewId(idParam: string): number | null {
  const reviewId = Number.parseInt(idParam, 10);
  if (!Number.isInteger(reviewId) || reviewId <= 0) return null;
  return reviewId;
}

export async function PATCH(
  request: NextRequest,
  { params }: ReviewRouteContext,
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return apiError("יש להתחבר כדי לערוך ביקורת", 401);
    }

    // Check rate limit for edit/delete
    const rateLimit = checkEditDeleteRateLimit(session.user.id);
    if (rateLimit.isLimited) {
      return apiError(
        `ביצעת יותר מדי עריכות לאחרונה. נסה שוב בעוד ${rateLimit.remainingTime} דקות.`,
        429,
      );
    }

    const { id } = await params;
    const reviewId = toReviewId(id);
    if (!reviewId) {
      return apiError("מזהה ביקורת לא תקין", 400);
    }

    const payload = await request.json();
    const result = updateReviewSchema.safeParse(payload);
    if (!result.success) {
      return apiError(formatZodErrors(result.error), 400);
    }

    // Check for profanity in title and text
    if (containsProfanity(result.data.title)) {
      return apiError("הכותרת מכילה שפה לא הולמת. אנא נסח.י מחדש.", 400);
    }

    if (containsProfanity(result.data.text)) {
      return apiError("התגובה מכילה שפה לא הולמת. אנא נסח.י מחדש.", 400);
    }

    const updated = await updateReviewByOwner(reviewId, session.user.id, {
      title: result.data.title,
      text: result.data.text,
      rating: result.data.rating,
    });

    if (!updated) {
      return apiError("הביקורת לא נמצאה", 404);
    }

    return apiSuccess({ review: updated });
  } catch (err: unknown) {
    return apiError(INTERNAL_ERROR_MESSAGE, 500, err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: ReviewRouteContext,
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return apiError("יש להתחבר כדי למחוק ביקורת", 401);
    }

    // Check rate limit for edit/delete
    const rateLimit = checkEditDeleteRateLimit(session.user.id);
    if (rateLimit.isLimited) {
      return apiError(
        `ביצעת יותר מדי עריכות לאחרונה. נסה שוב בעוד ${rateLimit.remainingTime} דקות.`,
        429,
      );
    }

    const { id } = await params;
    const reviewId = toReviewId(id);
    if (!reviewId) {
      return apiError("מזהה ביקורת לא תקין", 400);
    }

    const deleted = await deleteReviewByOwner(reviewId, session.user.id);
    if (!deleted) {
      return apiError("הביקורת לא נמצאה", 404);
    }

    return apiSuccess({ ok: true });
  } catch (err: unknown) {
    return apiError(INTERNAL_ERROR_MESSAGE, 500, err);
  }
}
