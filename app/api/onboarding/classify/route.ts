import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, careerPhases, objectives } from "@/lib/db/schema";
import { classifyCareerPhase } from "@/lib/pots/engine";
import { z } from "zod";

const classifySchema = z.object({
  email: z.string().email(),
  yearsExperience: z.number().min(0),
  degreeType: z.string(),
  internshipCount: z.number().min(0),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = classifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email, yearsExperience, degreeType, internshipCount } = parsed.data;
    const phase = classifyCareerPhase({ yearsExperience, degreeType, internshipCount });

    // Early Career only for Slice 1
    if (phase !== "early_career") {
      return NextResponse.json(
        { error: "Slice 1 supports Early Career only. Your inputs classify as: " + phase },
        { status: 400 }
      );
    }

    const [phaseRow] = await db.select().from(careerPhases).where(eq(careerPhases.slug, phase)).limit(1);
    if (!phaseRow) {
      return NextResponse.json({ error: "Career phase not found. Run seed script." }, { status: 500 });
    }

    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!existingUser) {
      await db.insert(users).values({ email, careerPhase: phase });
    } else {
      await db.update(users).set({ careerPhase: phase }).where(eq(users.id, existingUser.id));
    }

    const objectivesList = await db
      .select({ id: objectives.id, objectiveText: objectives.objectiveText, priority: objectives.priority })
      .from(objectives)
      .where(eq(objectives.phaseId, phaseRow.id))
      .orderBy(objectives.priority)
      .limit(2);

    return NextResponse.json({
      phase,
      phase_id: phaseRow.id,
      phase_name: phaseRow.name,
      phase_description: phaseRow.description,
      objective_ids: objectivesList.map((o) => o.id),
      objectives: objectivesList,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Classification failed" }, { status: 500 });
  }
}
