import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, evidence, cvGenerations } from "@/lib/db/schema";
import { structureCV, type CVStructure } from "@/lib/pots/cv-structure";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { CVDocument, type TailoredCV } from "@/lib/pdf/CVDocument";

const generateSchema = z.object({
  email: z.string().email(),
  targetRole: z.string().min(1),
  targetCompany: z.string().optional(),
});

const tailorSchema = z.object({
  summary: z.string(),
  bullets: z.record(z.string(), z.array(z.string())),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email, targetRole, targetCompany } = parsed.data;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Complete onboarding first." },
        { status: 404 }
      );
    }

    const evidenceRows = await db
      .select({
        id: evidence.id,
        type: evidence.type,
        title: evidence.title,
        description: evidence.description,
        credibilityScore: evidence.credibilityScore,
        skillTags: evidence.skillTags,
      })
      .from(evidence)
      .where(eq(evidence.userId, user.id))
      .orderBy(evidence.createdAt);

    const evidenceItems = evidenceRows.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      description: e.description,
      credibilityScore: e.credibilityScore,
      skillTags: e.skillTags ? JSON.parse(e.skillTags as string) : [],
    }));

    const structure = structureCV(targetRole, targetCompany, evidenceItems);

    const structureForPrompt = JSON.stringify(structure, null, 2);
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: tailorSchema,
      prompt: `You are a career advisor. Tailor this CV structure for the role "${targetRole}"${targetCompany ? ` at ${targetCompany}` : ""}.

CV structure (JSON):
${structureForPrompt}

Return:
1. summary: A 1-2 sentence professional summary tailored for this role.
2. bullets: An object mapping each item title to an array of 2-3 refined bullet points. Use the existing bullets as a base but reframe them to emphasize relevance to the target role. Keys must match the item titles from the structure.`,
    });

    const tailored: TailoredCV = {
      ...structure,
      tailoredSummary: object.summary,
      tailoredBullets: object.bullets,
    };

    await db.insert(cvGenerations).values({
      userId: user.id,
      targetRole,
      targetCompany: targetCompany ?? null,
      structureJson: JSON.stringify(structure),
    });

    const cvElement = React.createElement(CVDocument, { cv: tailored });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(cvElement as any);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cv-${targetRole.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate CV" }, { status: 500 });
  }
}
