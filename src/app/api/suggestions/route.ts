import { NextResponse } from "next/server";
import { getSuggestions } from "@/lib/data/suggestions";

export async function GET() {
  const suggestions = await getSuggestions();
  return NextResponse.json(suggestions, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
    },
  });
}
