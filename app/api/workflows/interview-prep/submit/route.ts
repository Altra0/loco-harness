import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { interviewPrepSessions, users } from "@/lib/db/schema";
import { scoreSolution } from "@/lib/pots/interview-prep";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { z } from "zod";

const submitSchema = z.object({
  sessionId: z.coerce.number(),
  solution: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { sessionId, solution } = parsed.data;

    const [session] = await db
      .select()
      .from(interviewPrepSessions)
      .where(eq(interviewPrepSessions.id, sessionId))
      .limit(1);

    if (!session || session.status !== "awaiting_submission") {
      return NextResponse.json({ error: "Session not found or already submitted" }, { status: 404 });
    }

    const rubric = JSON.parse(session.rubricJson) as {
      correctness?: number;
      clarity?: number;
      completeness?: number;
    };
    const scores = scoreSolution(solution, {
      correctness: rubric.correctness ?? 40,
      clarity: rubric.clarity ?? 30,
      completeness: rubric.completeness ?? 30,
    });

    const { text: feedback } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt: `You are an interview coach. A candidate submitted this solution to an interview problem.

Problem: ${session.problemStatement}

Solution: ${solution}

Scores (deterministic): Correctness ${scores.correctness}, Clarity ${scores.clarity}, Completeness ${scores.completeness}. Total: ${scores.total}/100.

Write 2-3 paragraphs of constructive feedback. Highlight strengths, suggest specific improvements, and give one concrete tip for the next interview.`,
    });

    await db
      .update(interviewPrepSessions)
      .set({
        status: "scored",
        solutionText: solution,
        scoresJson: JSON.stringify(scores),
        feedbackText: feedback,
      })
      .where(eq(interviewPrepSessions.id, sessionId));

    return NextResponse.json({
      scores: { correctness: scores.correctness, clarity: scores.clarity, completeness: scores.completeness, total: scores.total },
      feedback,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
