import { NextRequest } from "next/server";
import { deleteReviewByOwner, updateReviewByOwner } from "@/lib/reviews";
import { updateReviewSchema, formatZodErrors } from "@/lib/reviewSchemas";
import { checkFieldsForProfanity } from "@/utils/profanityFilter";
import { checkEditDeleteRateLimit } from "@/utils/reviewRateLimit";
import {
  apiError,
  apiSuccess,
  INTERNAL_ERROR_MESSAGE,
} from "@/utils/apiResponse";
import { requireApiAuth } from "@/utils/apiMiddleware";
import { toPositiveInt } from "@/utils/parseId";

interface ReviewRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: ReviewRouteContext,
) {
  try {
    const auth = await requireApiAuth("יש להתחבר כדי לערוך ביקורת", {
      check: checkEditDeleteRateLimit,
      message: (t) =>
        `ביצעת יותר מדי עריכות לאחרונה. נסה שוב בעוד ${t} דקות.`,
    });
    if (auth.error) return auth.error;
    const { session } = auth;

    const { id } = await params;
    const reviewId = toPositiveInt(id);
    if (!reviewId) {
      return apiError("מזהה ביקורת לא תקין", 400);
    }

    const payload = await request.json();
    const result = updateReviewSchema.safeParse(payload);
    if (!result.success) {
      return apiError(formatZodErrors(result.error), 400);
    }

    // Check for profanity in title and text
    const profanityMessages: Record<string, string> = {
      title: "הכותרת מכילה שפה לא הולמת. אנא נסח.י מחדש.",
      text: "התגובה מכילה שפה לא הולמת. אנא נסח.י מחדש.",
    };
    const badField = checkFieldsForProfanity({
      title: result.data.title,
      text: result.data.text,
    });
    if (badField) {
      return apiError(profanityMessages[badField], 400);
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
    const auth = await requireApiAuth("יש להתחבר כדי למחוק ביקורת", {
      check: checkEditDeleteRateLimit,
      message: (t) =>
        `ביצעת יותר מדי עריכות לאחרונה. נסה שוב בעוד ${t} דקות.`,
    });
    if (auth.error) return auth.error;
    const { session } = auth;

    const { id } = await params;
    const reviewId = toPositiveInt(id);
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
