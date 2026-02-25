import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { evidenceCompilerDrafts } from "@/lib/db/schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get("runId");
    if (!runId) {
      return NextResponse.json({ error: "runId required" }, { status: 400 });
    }

    const [draft] = await db
      .select()
      .from(evidenceCompilerDrafts)
      .where(eq(evidenceCompilerDrafts.runId, runId))
      .limit(1);

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const data = JSON.parse(draft.draftJson) as {
      repos: Array<{ name: string; analysis: unknown; narrative: string }>;
    };

    return NextResponse.json({
      runId: draft.runId,
      userId: draft.userId,
      repos: data.repos,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch draft" }, { status: 500 });
  }
}
