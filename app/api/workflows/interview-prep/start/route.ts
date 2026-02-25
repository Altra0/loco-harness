import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, interviewPrepSessions, interviewPrepProblems } from "@/lib/db/schema";
import { getTemplateSeed } from "@/lib/pots/interview-prep";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { z } from "zod";

const startSchema = z.object({
  email: z.string().email(),
  roleType: z.string().min(1),
  company: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email, roleType, company, difficulty } = parsed.data;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Complete onboarding first." },
        { status: 404 }
      );
    }

    const templates = await db
      .select()
      .from(interviewPrepProblems)
      .where(eq(interviewPrepProblems.roleType, roleType))
      .limit(10);

    const difficultyTemplates = templates.filter((t) => t.difficulty === difficulty);
    const candidates = difficultyTemplates.length ? difficultyTemplates : templates;

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: "No problem templates found. Run: npm run db:seed-interview" },
        { status: 400 }
      );
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const seed = getTemplateSeed(roleType, difficulty, company ?? "", dateStr);
    const template = candidates[Math.abs(seed % candidates.length)];

    const { text: problemStatement } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt: `Customize this interview problem for a ${difficulty} ${roleType} role${company ? ` at ${company}` : ""}.

Template: ${template.templateText}

Write a clear, self-contained problem statement (2-4 paragraphs). Keep the same core task but add company-relevant context if applicable.`,
    });

    const [session] = await db
      .insert(interviewPrepSessions)
      .values({
        userId: user.id,
        roleType,
        company: company ?? null,
        difficulty,
        problemTemplateId: template.id,
        problemStatement,
        rubricJson: template.rubricJson,
        status: "awaiting_submission",
      })
      .returning({ id: interviewPrepSessions.id });

    return NextResponse.json({
      sessionId: session!.id,
      problemStatement,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}
