import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { addReview } from "@/lib/shows";
import { authOptions } from "@/lib/auth";
import { createReviewSchema, formatZodErrors } from "@/constants/reviewSchemas";
import { containsProfanity } from "@/utils/profanityFilter";
import { checkReviewRateLimit } from "@/utils/reviewRateLimit";
import {
  apiError,
  apiSuccess,
  INTERNAL_ERROR_MESSAGE,
} from "@/utils/apiResponse";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return apiError("יש להתחבר כדי לכתוב ביקורת", 401);
    }

    // Check rate limit
    const rateLimit = await checkReviewRateLimit(session.user.id);
    if (rateLimit.isLimited) {
      return apiError(
        `יצרת יותר מדי ביקורות לאחרונה. נסה שוב בעוד ${rateLimit.remainingTime} דקות.`,
        429,
      );
    }

    const formData = await request.formData();
    const payload = Object.fromEntries(formData.entries());

    const result = createReviewSchema.safeParse(payload);
    if (!result.success) {
      return apiError(formatZodErrors(result.error), 400);
    }

    const { showId, name, title, rating, text } = result.data;

    // Check for profanity in title, text, and author name
    if (containsProfanity(title)) {
      return apiError("הכותרת מכילה שפה לא הולמת. אנא נסח.י מחדש.", 400);
    }

    if (containsProfanity(text)) {
      return apiError("התגובה מכילה שפה לא הולמת. אנא נסח.י מחדש.", 400);
    }

    const authorName = session.user.name?.trim() || name?.trim() || "משתמש/ת";

    if (containsProfanity(authorName)) {
      return apiError("השם מכיל שפה לא הולמת. אנא בחר.י שם אחר.", 400);
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
