import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, conversations } from "@/lib/db/schema";

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

    const [conv] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.userId, user.id))
      .orderBy(desc(conversations.createdAt))
      .limit(1);

    if (!conv) {
      return NextResponse.json({ conversationId: null });
    }

    return NextResponse.json({ conversationId: conv.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch latest" }, { status: 500 });
  }
}
