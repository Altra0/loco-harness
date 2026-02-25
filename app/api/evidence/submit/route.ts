import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, evidence } from "@/lib/db/schema";
import { scoreEvidence, extractSkillTags, type EvidenceType } from "@/lib/pots/scorer";
import { z } from "zod";
import { randomBytes } from "crypto";

const submitSchema = z.object({
  email: z.string().email(),
  type: z.enum(["project", "credential", "achievement"]),
  title: z.string().min(1),
  description: z.string().optional(),
  links: z.array(z.string().url()).optional().default([]),
  hasPublicRepo: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email, type, title, description, links, hasPublicRepo } = parsed.data;
    const hasDates = /20\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{1,2}\/\d{2,4}/i.test(description ?? "");

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found. Complete onboarding first." }, { status: 404 });
    }

    const credibilityScore = scoreEvidence({
      type: type as EvidenceType,
      title,
      description,
      links,
      hasPublicRepo,
      hasDates,
    });

    const skillTags = description ? extractSkillTags(description) : [];
    const shareToken = `ev_${randomBytes(16).toString("hex")}`;

    const [inserted] = await db
      .insert(evidence)
      .values({
        userId: user.id,
        type,
        title,
        description: description ?? null,
        credibilityScore,
        skillTags: skillTags.length > 0 ? JSON.stringify(skillTags) : null,
        isShareable: false,
        shareToken,
      })
      .returning();

    return NextResponse.json({
      evidence_id: inserted.id,
      score: credibilityScore,
      skill_tags: skillTags,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Evidence submission failed" }, { status: 500 });
  }
}
