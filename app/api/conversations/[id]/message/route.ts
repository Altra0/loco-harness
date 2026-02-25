import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  conversations,
  conversationMessages,
  users,
  careerPhases,
  objectives,
  evidence,
} from "@/lib/db/schema";
import { streamSergentReply, SergentContext } from "@/lib/ai/sergent";
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = parseInt(id, 10);
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    await db.insert(conversationMessages).values({
      conversationId,
      role: "user",
      content: parsed.data.content,
    });

    const historyRows = await db
      .select({ role: conversationMessages.role, content: conversationMessages.content })
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversationId))
      .orderBy(conversationMessages.createdAt);

    const messages = historyRows.map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
    }));

    const [user] = await db.select().from(users).where(eq(users.id, conv.userId)).limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 500 });
    }

    let phaseName = "Unknown";
    let phaseDescription: string | null = null;
    let objectivesList: { id: number; objectiveText: string; priority: number }[] = [];
    let evidenceList: { title: string; type: string; credibilityScore: number | null; skillTags: string[] }[] = [];

    if (user.careerPhase) {
      const [phaseRow] = await db
        .select()
        .from(careerPhases)
        .where(eq(careerPhases.slug, user.careerPhase))
        .limit(1);
      if (phaseRow) {
        phaseName = phaseRow.name;
        phaseDescription = phaseRow.description;
        const objs = await db
          .select({
            id: objectives.id,
            objectiveText: objectives.objectiveText,
            priority: objectives.priority,
          })
          .from(objectives)
          .where(eq(objectives.phaseId, phaseRow.id))
          .orderBy(objectives.priority)
          .limit(5);
        objectivesList = objs;
      }
    }

    const evidenceRows = await db
      .select({
        title: evidence.title,
        type: evidence.type,
        credibilityScore: evidence.credibilityScore,
        skillTags: evidence.skillTags,
      })
      .from(evidence)
      .where(eq(evidence.userId, user.id))
      .orderBy(evidence.createdAt);

    evidenceList = evidenceRows.map((e) => ({
      title: e.title,
      type: e.type,
      credibilityScore: e.credibilityScore,
      skillTags: e.skillTags ? JSON.parse(e.skillTags as string) : [],
    }));

    const context: SergentContext = {
      phaseName,
      phaseDescription,
      objectives: objectivesList,
      evidence: evidenceList,
    };

    const onFinish = async (text: string) => {
      await db.insert(conversationMessages).values({
        conversationId,
        role: "assistant",
        content: text,
      });
    };

    const streamResponse = await streamSergentReply(context, messages, onFinish);
    return streamResponse;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
