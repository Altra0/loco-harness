import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { evidence } from "@/lib/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const id = parseInt(userId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const items = await db
      .select()
      .from(evidence)
      .where(eq(evidence.userId, id))
      .orderBy(evidence.createdAt);

    return NextResponse.json(
      items.map((e) => ({
        id: e.id,
        type: e.type,
        title: e.title,
        description: e.description,
        credibilityScore: e.credibilityScore,
        skillTags: e.skillTags ? JSON.parse(e.skillTags as string) : [],
        isShareable: e.isShareable,
        shareToken: e.shareToken,
        submissionDate: e.submissionDate,
        createdAt: e.createdAt,
      }))
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch vault" }, { status: 500 });
  }
}
