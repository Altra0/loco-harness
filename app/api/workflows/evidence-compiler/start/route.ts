import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  users,
  githubIntegrations,
  evidenceCompilerDrafts,
} from "@/lib/db/schema";
import { analyzeRepo, type RepoAnalysis } from "@/lib/pots/github-analyzer";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { z } from "zod";
import { randomUUID } from "crypto";

const startSchema = z.object({
  email: z.string().email(),
});

type ProgressEvent =
  | { type: "progress"; message: string; step: number; total: number }
  | { type: "complete"; runId: string }
  | { type: "error"; message: string };

function createStream(producer: (writer: WritableStreamDefaultWriter<string>) => Promise<void>) {
  const { writable, readable } = new TransformStream<string, string>();
  const writer = writable.getWriter();
  producer(writer).catch((err) => {
    console.error(err);
  });
  return readable;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email } = parsed.data;
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Complete onboarding first." },
        { status: 404 }
      );
    }

    const [gh] = await db
      .select()
      .from(githubIntegrations)
      .where(eq(githubIntegrations.userId, user.id))
      .limit(1);
    if (!gh) {
      return NextResponse.json(
        { error: "GitHub not connected. Connect GitHub first." },
        { status: 400 }
      );
    }

    const runId = randomUUID();

    const stream = createStream(async (writer) => {
      const send = (e: ProgressEvent) => {
        writer.write(JSON.stringify(e) + "\n");
      };

      try {
        send({ type: "progress", message: "Fetching repos...", step: 1, total: 5 });

        const reposRes = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
          headers: {
            Authorization: `Bearer ${gh.accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (!reposRes.ok) {
          const errText = await reposRes.text();
          send({ type: "error", message: `GitHub API error: ${errText}` });
          return;
        }

        const repos = (await reposRes.json()) as Array<{
          name: string;
          full_name: string;
          stargazers_count: number;
          language: string | null;
          languages_url?: string;
          fork: boolean;
          default_branch: string;
        }>;

        const owned = repos.filter((r) => !r.fork).slice(0, 10);
        const total = owned.length;
        if (total === 0) {
          send({ type: "error", message: "No owned repos found." });
          return;
        }

        const results: { name: string; analysis: RepoAnalysis; narrative: string }[] = [];

        for (let i = 0; i < owned.length; i++) {
          const repo = owned[i];
          send({
            type: "progress",
            message: `Analyzing ${repo.full_name} (${i + 1}/${total})...`,
            step: 2 + i,
            total: total + 2,
          });

          let commitCount = 0;
          try {
            const commitsRes = await fetch(
              `https://api.github.com/repos/${repo.full_name}/commits?per_page=1`,
              {
                headers: {
                  Authorization: `Bearer ${gh.accessToken}`,
                  Accept: "application/vnd.github.v3+json",
                },
              }
            );
            if (commitsRes.ok) {
              const link = commitsRes.headers.get("Link");
              const match = link?.match(/page=(\d+)>; rel="last"/);
              commitCount = match ? parseInt(match[1], 10) : 1;
            }
          } catch {
            /* ignore */
          }

          const analysis = analyzeRepo({
            ...repo,
            commit_count: commitCount,
          });

          send({
            type: "progress",
            message: `Writing narrative for ${repo.full_name}...`,
            step: 2 + total + i,
            total: total * 2 + 2,
          });

          const { text } = await generateText({
            model: anthropic("claude-sonnet-4-20250514"),
            prompt: `Turn this repo analysis into 2-3 sentences of career evidence narrative.

Repo: ${analysis.name}
Stars: ${analysis.stars}
Languages: ${analysis.languages.join(", ") || "—"}
Score: ${analysis.credibilityBaseScore}/100
Has tests: ${analysis.hasTests}
Deployed: ${analysis.isDeployed}

Write a brief, professional narrative suitable for a CV or evidence vault. Be specific about the tech stack and impact.`,
          });

          results.push({ name: analysis.name, analysis, narrative: text });
        }

        const draftJson = JSON.stringify({
          repos: results.map((r) => ({
            name: r.name,
            analysis: r.analysis,
            narrative: r.narrative,
          })),
        });

        await db.insert(evidenceCompilerDrafts).values({
          runId,
          userId: user.id,
          draftJson,
        });

        send({ type: "complete", runId });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        writer.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to start" }, { status: 500 });
  }
}
