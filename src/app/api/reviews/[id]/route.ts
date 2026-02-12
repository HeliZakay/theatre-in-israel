import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import * as z from "zod";
import { authOptions } from "@/lib/auth";
import { deleteReviewByOwner, updateReviewByOwner } from "@/lib/shows";
import {
  REVIEW_COMMENT_MAX,
  REVIEW_COMMENT_MIN,
  REVIEW_TITLE_MAX,
  REVIEW_TITLE_MIN,
} from "@/constants/reviewValidation";

interface ReviewRouteContext {
  params: Promise<{ id: string }>;
}

const updateReviewSchema = z.object({
  title: z
    .string()
    .trim()
    .min(REVIEW_TITLE_MIN, "Title is too short")
    .max(REVIEW_TITLE_MAX, "Title is too long"),
  rating: z.preprocess(
    (v) => (typeof v === "string" ? parseInt(v, 10) : v),
    z.number().int().min(1).max(5),
  ),
  comment: z
    .string()
    .trim()
    .min(REVIEW_COMMENT_MIN, "Comment is too short")
    .max(REVIEW_COMMENT_MAX, "Comment is too long"),
});

function toReviewId(idParam: string): number | null {
  const reviewId = Number.parseInt(idParam, 10);
  if (!Number.isInteger(reviewId) || reviewId <= 0) return null;
  return reviewId;
}

function formatZodErrors(err: z.ZodError): string {
  if (!err?.issues) return "נתונים לא תקינים";
  return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

export async function PATCH(request: NextRequest, { params }: ReviewRouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "יש להתחבר כדי לערוך ביקורת" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const reviewId = toReviewId(id);
    if (!reviewId) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const payload = await request.json();
    const result = updateReviewSchema.safeParse(payload);
    if (!result.success) {
      return NextResponse.json(
        { error: formatZodErrors(result.error) },
        { status: 400 },
      );
    }

    const updated = await updateReviewByOwner(reviewId, session.user.id, {
      title: result.data.title,
      text: result.data.comment,
      rating: result.data.rating,
    });

    if (!updated) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ review: updated }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: ReviewRouteContext,
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "יש להתחבר כדי למחוק ביקורת" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const reviewId = toReviewId(id);
    if (!reviewId) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const deleted = await deleteReviewByOwner(reviewId, session.user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
