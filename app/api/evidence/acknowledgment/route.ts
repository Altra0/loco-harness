import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export async function POST(request: Request) {
  const body = await request.json();
  const { title, score, skill_tags } = body as {
    title: string;
    score: number;
    skill_tags: string[];
  };

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    prompt: `You are a supportive career advisor. A user just submitted evidence: "${title}" with a credibility score of ${score}/100${skill_tags?.length ? ` and skill tags: ${skill_tags.join(", ")}` : ""}. Write a brief, personalized acknowledgment (1-2 sentences) that validates their effort and encourages them. Be warm and specific.`,
  });
  return Response.json({ acknowledgment: text });
}
