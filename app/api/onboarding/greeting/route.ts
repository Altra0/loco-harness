import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export async function POST(request: Request) {
  const body = await request.json();
  const phase_name = body.phase_name ?? body.prompt ?? "Early Career";

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    prompt: `You are a warm career advisor. The user just completed onboarding and was classified into the "${phase_name}" career phase. Write a brief, personalized greeting (2-3 sentences) that congratulates them and introduces their first objectives. Be encouraging and professional.`,
  });
  return Response.json({ greeting: text });
}
