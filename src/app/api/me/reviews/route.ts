import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReviewsByUser } from "@/lib/shows";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "יש להתחבר כדי לצפות בביקורות" }, { status: 401 });
    }

    const reviews = await getReviewsByUser(session.user.id);
    return NextResponse.json({ reviews }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
