import { NextResponse } from "next/server";
import { addReview } from "@/lib/shows";

function normalize(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request) {
  const formData = await request.formData();
  const showId = normalize(formData.get("showId"));
  const name = normalize(formData.get("name"));
  const title = normalize(formData.get("title"));
  const comment = normalize(formData.get("comment"));
  const ratingValue = normalize(formData.get("rating"));
  const rating = Number.parseInt(ratingValue, 10);

  if (!showId || !name || !title || !comment || !ratingValue) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const result = await addReview(showId, {
    author: name,
    title,
    text: comment,
    rating,
    date: today,
  });

  if (!result) {
    return NextResponse.json({ error: "Show not found" }, { status: 404 });
  }

  return NextResponse.redirect(new URL(`/shows/${showId}`, request.url), 303);
}
