import { NextRequest, NextResponse } from "next/server";
import { parseShowsSearchParams } from "@/utils/showsQuery";
import {
  buildWhereClause,
  buildOrderBy,
  fetchShowsPage,
} from "@/lib/data/showsList";

const PER_PAGE = 12;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const raw: Record<string, string | string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    const existing = raw[key];
    if (existing !== undefined) {
      raw[key] = Array.isArray(existing)
        ? [...existing, value]
        : [existing, value];
    } else {
      raw[key] = value;
    }
  }

  const filters = parseShowsSearchParams(raw);
  const page = Math.max(1, filters.page);
  const where = buildWhereClause(filters);
  const orderBy = buildOrderBy(filters.sort);
  const skip = (page - 1) * PER_PAGE;

  const shows = await fetchShowsPage(where, orderBy, skip, PER_PAGE + 1);
  const hasMore = shows.length > PER_PAGE;
  const sliced = hasMore ? shows.slice(0, PER_PAGE) : shows;

  const headers: HeadersInit = filters.query
    ? { "Cache-Control": "private, no-store" }
    : { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" };

  return NextResponse.json({ shows: sliced, hasMore }, { headers });
}
