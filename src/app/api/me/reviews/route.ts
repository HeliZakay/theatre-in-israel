import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReviewsByUser } from "@/lib/shows";
import {
  apiError,
  apiSuccess,
  INTERNAL_ERROR_MESSAGE,
} from "@/utils/apiResponse";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return apiError("יש להתחבר כדי לצפות בביקורות", 401);
    }

    const reviews = await getReviewsByUser(session.user.id);
    return apiSuccess({ reviews });
  } catch (err: unknown) {
    return apiError(INTERNAL_ERROR_MESSAGE, 500, err);
  }
}
