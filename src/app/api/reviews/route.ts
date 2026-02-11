import { NextResponse, NextRequest } from "next/server";
import { addReview } from "@/lib/shows";
import * as z from "zod";

const reviewSchema = z.object({
  showId: z.string().trim().min(1, "Missing showId"),
  name: z.string().trim().min(2, "Name is too short"),
  title: z.string().trim().min(2, "Title is too short"),
  rating: z.preprocess(
    (v) => (typeof v === "string" ? parseInt(v, 10) : v),
    z.number().int().min(1).max(5),
  ),
  comment: z.string().trim().min(10, "Comment is too short"),
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
