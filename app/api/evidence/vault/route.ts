import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, evidence } from "@/lib/db/schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "email query param required" }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(evidence)
      .where(eq(evidence.userId, user.id))
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
