import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { evidenceCompilerDrafts, evidence } from "@/lib/db/schema";
import { scoreEvidence, extractSkillTags } from "@/lib/pots/scorer";
import { z } from "zod";
import { randomBytes } from "crypto";

const approveSchema = z.object({
  runId: z.string(),
  selected: z.array(z.object({
    name: z.string(),
    narrative: z.string(),
    credibilityBaseScore: z.number(),
    languages: z.array(z.string()),
  })),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { runId, selected } = parsed.data;

    const [draft] = await db
      .select()
      .from(evidenceCompilerDrafts)
      .where(eq(evidenceCompilerDrafts.runId, runId))
      .limit(1);

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const created: { id: number; title: string }[] = [];

    for (const item of selected) {
      const combined = `${item.name} ${item.narrative} ${item.languages.join(" ")}`;
      const tags = extractSkillTags(combined);

      const score = scoreEvidence({
        type: "project",
        title: item.name,
        description: item.narrative,
        links: [`https://github.com/${item.name}`],
        hasPublicRepo: true,
      });

      const shareToken = randomBytes(16).toString("hex");

      const [inserted] = await db
        .insert(evidence)
        .values({
          userId: draft.userId,
          type: "project",
          title: item.name,
          description: item.narrative,
          credibilityScore: Math.round((score + item.credibilityBaseScore) / 2),
          skillTags: JSON.stringify(tags),
          isShareable: false,
          shareToken,
        })
        .returning({ id: evidence.id, title: evidence.title });

      if (inserted) {
        created.push({ id: inserted.id, title: inserted.title });
      }
    }

    return NextResponse.json({ created });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
