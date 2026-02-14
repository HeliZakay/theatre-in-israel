import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addToWatchlist, getWatchlistByUser } from "@/lib/watchlist";
import { requireApiAuth } from "@/utils/apiMiddleware";
import {
  apiError,
  apiSuccess,
  INTERNAL_ERROR_MESSAGE,
} from "@/utils/apiResponse";
import { toPositiveInt } from "@/utils/parseId";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth("יש להתחבר כדי לנהל רשימת צפייה");
    if (auth.error) return auth.error;
    const { session } = auth;

    const body = await request.json();
    const showId = toPositiveInt(String(body.showId));
    if (!showId) {
      return apiError("מזהה הצגה לא תקין", 400);
    }

    await addToWatchlist(session.user.id, showId);
    return apiSuccess({ ok: true }, 201);
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err) {
      if ((err as any).code === "P2002") {
        return apiError("ההצגה כבר ברשימת הצפייה", 409);
      }
      if ((err as any).code === "P2003") {
        return apiError("ההצגה לא נמצאה", 404);
      }
    }

    return apiError(INTERNAL_ERROR_MESSAGE, 500, err);
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return apiError("יש להתחבר כדי לנהל רשימת צפייה", 401);
    }

    const watchlist = await getWatchlistByUser(session.user.id);
    return apiSuccess({ watchlist });
  } catch (err: unknown) {
    return apiError(INTERNAL_ERROR_MESSAGE, 500, err);
  }
}
