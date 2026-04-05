"use server";

import { revalidatePath } from "next/cache";
import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlistShowIds,
} from "@/lib/watchlist";
import { requireActionAuth } from "@/utils/actionAuth";
import { checkWatchlistRateLimit } from "@/utils/rateLimitCheckers";
import { toPositiveInt } from "@/utils/parseId";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  actionSuccess,
  actionError,
  INTERNAL_ERROR_MESSAGE,
  type ActionResult,
} from "@/types/actionResult";
import { isPrismaError } from "@/utils/prismaError";

export async function addToWatchlistAction(
  showId: number,
): Promise<ActionResult<void>> {
  try {
    const auth = await requireActionAuth("יש להתחבר כדי לנהל רשימת צפייה", {
      check: checkWatchlistRateLimit,
      message: () => "יותר מדי פעולות ברשימת הצפייה. נסו שוב מאוחר יותר",
    });
    if (auth.error) return auth.error;
    const { session } = auth;

    const validId = toPositiveInt(String(showId));
    if (!validId) {
      return actionError("מזהה הצגה לא תקין");
    }

    await addToWatchlist(session.user.id, validId);
    return actionSuccess(undefined);
  } catch (err: unknown) {
    if (isPrismaError(err)) {
      if (err.code === "P2002") {
        return actionError("ההצגה כבר ברשימת הצפייה");
      }
      if (err.code === "P2003") {
        return actionError("ההצגה לא נמצאה");
      }
    }
    return actionError(INTERNAL_ERROR_MESSAGE, err);
  }
}

export async function removeFromWatchlistAction(
  showId: number,
): Promise<ActionResult<void>> {
  try {
    const auth = await requireActionAuth("יש להתחבר כדי לנהל רשימת צפייה", {
      check: checkWatchlistRateLimit,
      message: () => "יותר מדי פעולות ברשימת הצפייה. נסו שוב מאוחר יותר",
    });
    if (auth.error) return auth.error;
    const { session } = auth;

    const validId = toPositiveInt(String(showId));
    if (!validId) {
      return actionError("מזהה הצגה לא תקין");
    }

    const deleted = await removeFromWatchlist(session.user.id, validId);
    if (!deleted) {
      return actionError("ההצגה לא נמצאה ברשימת הצפייה");
    }

    revalidatePath("/me/watchlist");
    return actionSuccess(undefined);
  } catch (err: unknown) {
    return actionError(INTERNAL_ERROR_MESSAGE, err);
  }
}

export async function getWatchlistIdsAction(): Promise<number[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  return getWatchlistShowIds(session.user.id);
}
