import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { evidence } from "@/lib/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    const [item] = await db
      .select()
      .from(evidence)
      .where(and(eq(evidence.shareToken, shareToken), eq(evidence.isShareable, true)))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Evidence not found or not shareable" }, { status: 404 });
    }

    return NextResponse.json({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      credibilityScore: item.credibilityScore,
      skillTags: item.skillTags ? JSON.parse(item.skillTags as string) : [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch shared evidence" }, { status: 500 });
  }
}
