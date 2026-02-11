import { NextResponse, NextRequest } from "next/server";
import { addReview } from "@/lib/shows";
import * as z from "zod";
import {
  REVIEW_COMMENT_MAX,
  REVIEW_COMMENT_MIN,
  REVIEW_NAME_MAX,
  REVIEW_NAME_MIN,
  REVIEW_TITLE_MAX,
  REVIEW_TITLE_MIN,
} from "@/constants/reviewValidation";

const reviewSchema = z.object({
  showId: z.string().trim().min(1, "Missing showId"),
  name: z
    .string()
    .trim()
    .min(REVIEW_NAME_MIN, "Name is too short")
    .max(REVIEW_NAME_MAX, "Name is too long"),
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

function formatZodErrors(err: z.ZodError): string {
  if (!err?.issues) return "Invalid input";
  return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const payload = Object.fromEntries(formData.entries());

    const result = reviewSchema.safeParse(payload);
    if (!result.success) {
      return NextResponse.json(
        { error: formatZodErrors(result.error) },
        { status: 400 },
      );
    }

    const { showId, name, title, rating, comment } = result.data;

    const today = new Date().toISOString().slice(0, 10);
    const added = await addReview(showId, {
      author: name,
      title,
      text: comment,
      rating,
      date: today,
    });

    if (!added) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    return NextResponse.redirect(new URL(`/shows/${showId}`, request.url), 303);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
