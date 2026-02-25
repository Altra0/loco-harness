import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { interviewPrepSessions, evidence } from "@/lib/db/schema";
import { extractSkillTags } from "@/lib/pots/scorer";
import { scoreEvidence } from "@/lib/pots/scorer";
import { z } from "zod";
import { randomBytes } from "crypto";

const logSchema = z.object({
  sessionId: z.coerce.number(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = logSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const [session] = await db
      .select()
      .from(interviewPrepSessions)
      .where(eq(interviewPrepSessions.id, parsed.data.sessionId))
      .limit(1);

    if (!session || session.status !== "scored") {
      return NextResponse.json({ error: "Session not found or not scored" }, { status: 404 });
    }

    const scores = session.scoresJson ? JSON.parse(session.scoresJson) as { total: number } : { total: 0 };

    const title = `Interview prep: ${session.roleType} (${session.difficulty})${session.company ? ` @ ${session.company}` : ""}`;
    const description = [
      session.problemStatement?.slice(0, 200) ?? "",
      session.solutionText ? `\n\nSolution: ${session.solutionText.slice(0, 300)}...` : "",
      `\n\nScore: ${scores.total}/100`,
    ].join("");

    const tags = extractSkillTags(`${session.roleType} ${session.difficulty} ${description}`);
    const evScore = scoreEvidence({
      type: "achievement",
      title,
      description,
      hasDates: true,
    });

    const [inserted] = await db
      .insert(evidence)
      .values({
        userId: session.userId,
        type: "achievement",
        title,
        description,
        credibilityScore: Math.round((evScore + scores.total) / 2),
        skillTags: JSON.stringify(tags),
        isShareable: false,
        shareToken: randomBytes(16).toString("hex"),
      })
      .returning({ id: evidence.id, title: evidence.title });

    return NextResponse.json({ created: { id: inserted!.id, title: inserted!.title } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to log evidence" }, { status: 500 });
  }
}
