import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  users,
  careerPhases,
  objectives,
  evidence,
  conversations,
} from "@/lib/db/schema";
import { z } from "zod";

const startSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Complete onboarding first." },
        { status: 404 }
      );
    }

    const phaseSlug = user.careerPhase;
    let phaseId: number | null = null;
    let phaseName = "Unknown";
    let phaseDescription: string | null = null;
    let objectivesList: { id: number; objectiveText: string; priority: number }[] = [];

    if (phaseSlug) {
      const [phaseRow] = await db
        .select()
        .from(careerPhases)
        .where(eq(careerPhases.slug, phaseSlug))
        .limit(1);
      if (phaseRow) {
        phaseId = phaseRow.id;
        phaseName = phaseRow.name;
        phaseDescription = phaseRow.description;
        const objs = await db
          .select({ id: objectives.id, objectiveText: objectives.objectiveText, priority: objectives.priority })
          .from(objectives)
          .where(eq(objectives.phaseId, phaseRow.id))
          .orderBy(objectives.priority)
          .limit(5);
        objectivesList = objs;
      }
    }

    const [conv] = await db
      .insert(conversations)
      .values({
        userId: user.id,
        phaseId,
      })
      .returning({ id: conversations.id });

    if (!conv) {
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    return NextResponse.json({
      conversationId: conv.id,
      phaseName,
      objectives: objectivesList,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
  }
}
