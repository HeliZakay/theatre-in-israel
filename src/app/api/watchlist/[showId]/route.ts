import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { removeFromWatchlist, isShowInWatchlist } from "@/lib/watchlist";
import { requireApiAuth } from "@/utils/apiMiddleware";
import {
  apiError,
  apiSuccess,
  INTERNAL_ERROR_MESSAGE,
} from "@/utils/apiResponse";
import { toPositiveInt } from "@/utils/parseId";

interface WatchlistRouteContext {
  params: Promise<{ showId: string }>;
}

export async function DELETE(
  _request: Request,
  { params }: WatchlistRouteContext,
) {
  try {
    const auth = await requireApiAuth("יש להתחבר כדי לנהל רשימת צפייה");
    if (auth.error) return auth.error;
    const { session } = auth;

    const { showId: rawId } = await params;
    const showId = toPositiveInt(rawId);
    if (!showId) {
      return apiError("מזהה הצגה לא תקין", 400);
    }

    const deleted = await removeFromWatchlist(session.user.id, showId);
    if (!deleted) {
      return apiError("ההצגה לא נמצאה ברשימת הצפייה", 404);
    }

    return apiSuccess({ ok: true });
  } catch (err: unknown) {
    return apiError(INTERNAL_ERROR_MESSAGE, 500, err);
  }
}

export async function GET(
  _request: Request,
  { params }: WatchlistRouteContext,
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return apiError("יש להתחבר כדי לנהל רשימת צפייה", 401);
    }

    const { showId: rawId } = await params;
    const showId = toPositiveInt(rawId);
    if (!showId) {
      return apiError("מזהה הצגה לא תקין", 400);
    }

    const inWatchlist = await isShowInWatchlist(session.user.id, showId);
    return apiSuccess({ inWatchlist });
  } catch (err: unknown) {
    return apiError(INTERNAL_ERROR_MESSAGE, 500, err);
  }
}
