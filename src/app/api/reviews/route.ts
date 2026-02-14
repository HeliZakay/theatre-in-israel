import { NextRequest } from "next/server";
import { addReview } from "@/lib/reviews";
import { createReviewSchema, formatZodErrors } from "@/lib/reviewSchemas";
import { checkFieldsForProfanity } from "@/utils/profanityFilter";
import { checkReviewRateLimit } from "@/utils/reviewRateLimit";
import {
  apiError,
  apiSuccess,
  INTERNAL_ERROR_MESSAGE,
} from "@/utils/apiResponse";
import { requireApiAuth } from "@/utils/apiMiddleware";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth("יש להתחבר כדי לכתוב ביקורת", {
      check: checkReviewRateLimit,
      message: (t) =>
        `יצרת יותר מדי ביקורות לאחרונה. נסה שוב בעוד ${t} דקות.`,
    });
    if (auth.error) return auth.error;
    const { session } = auth;

    const formData = await request.formData();
    const payload = Object.fromEntries(formData.entries());

    const result = createReviewSchema.safeParse(payload);
    if (!result.success) {
      return apiError(formatZodErrors(result.error), 400);
    }

    const { showId, name, title, rating, text } = result.data;

    const authorName = session.user.name?.trim() || name?.trim() || "משתמש/ת";

    // Check for profanity in title, text, and author name
    const profanityMessages: Record<string, string> = {
      title: "הכותרת מכילה שפה לא הולמת. אנא נסח.י מחדש.",
      text: "התגובה מכילה שפה לא הולמת. אנא נסח.י מחדש.",
      authorName: "השם מכיל שפה לא הולמת. אנא בחר.י שם אחר.",
    };
    const badField = checkFieldsForProfanity({ title, text, authorName });
    if (badField) {
      return apiError(profanityMessages[badField], 400);
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

    return apiSuccess({ success: true, showId });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err) {
      // Handle unique constraint violation (duplicate review)
      if (err.code === "P2002") {
        return apiError("כבר כתבת ביקורת להצגה זו.", 409);
      }
      // Handle foreign key violation (show not found)
      if (err.code === "P2003") {
        return apiError("ההצגה לא נמצאה", 404);
      }
    }

    return apiError(INTERNAL_ERROR_MESSAGE, 500, err);
  }
}
