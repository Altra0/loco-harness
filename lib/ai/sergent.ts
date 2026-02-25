import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export interface SergentContext {
  phaseName: string;
  phaseDescription: string | null;
  objectives: { id: number; objectiveText: string; priority: number }[];
  evidence: { title: string; type: string; credibilityScore: number | null; skillTags: string[] }[];
}

export function buildSergentSystemPrompt(context: SergentContext): string {
  const objectivesList = context.objectives
    .map((o) => `- [${o.priority}] ${o.objectiveText}`)
    .join("\n");
  const evidenceList =
    context.evidence.length > 0
      ? context.evidence
          .map(
            (e) =>
              `- ${e.title} (${e.type}): score ${e.credibilityScore ?? "—"}/100${e.skillTags.length ? `, skills: ${e.skillTags.join(", ")}` : ""}`
          )
          .join("\n")
      : "No evidence yet.";

  return `You are SERGENT, a warm and supportive career advisor. You help users think through their career decisions, evidence, and progress. You do NOT make binding decisions—you advise; the user decides.

LAYER 1 CONTEXT (authoritative—never contradict this):
- Career phase: ${context.phaseName}
- Phase description: ${context.phaseDescription ?? "—"}

Current objectives:
${objectivesList}

Evidence in vault:
${evidenceList}

RULES:
1. Use the phase and evidence above as ground truth. Never say the user is in a different phase or has different evidence scores.
2. Be conversational: coach, challenge gently, celebrate wins.
3. Keep responses focused and helpful (2–4 paragraphs typically).
4. If asked about next steps, reference their objectives and evidence gaps.
5. You are encouraging but honest—point out strengths and areas to build.`;
}

export async function streamSergentReply(
  context: SergentContext,
  messages: { role: "user" | "assistant"; content: string }[],
  onFinish?: (text: string) => Promise<void>
) {
  const system = buildSergentSystemPrompt(context);
  const modelMessages = messages.map((m) =>
    m.role === "user"
      ? { role: "user" as const, content: m.content }
      : { role: "assistant" as const, content: m.content }
  );

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system,
    messages: modelMessages,
    onFinish: onFinish
      ? async ({ text }) => {
          await onFinish(text);
        }
      : undefined,
  });

  return result.toTextStreamResponse();
}
