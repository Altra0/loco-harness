import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, githubIntegrations } from "@/lib/db/schema";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${BASE_URL}/evidence-compiler?error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${BASE_URL}/evidence-compiler?error=${encodeURIComponent("Missing code or state")}`
    );
  }

  let email: string;
  try {
    email = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8")
    ).email;
  } catch {
    return NextResponse.redirect(
      `${BASE_URL}/evidence-compiler?error=${encodeURIComponent("Invalid state")}`
    );
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return NextResponse.redirect(
      `${BASE_URL}/evidence-compiler?error=${encodeURIComponent("OAuth not configured")}`
    );
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${BASE_URL}/api/auth/github/callback`,
    }),
  });

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
  };

  if (!tokenData.access_token) {
    return NextResponse.redirect(
      `${BASE_URL}/evidence-compiler?error=${encodeURIComponent(
        tokenData.error ?? "Failed to get token"
      )}`
    );
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return NextResponse.redirect(
      `${BASE_URL}/evidence-compiler?error=${encodeURIComponent("User not found. Complete onboarding first.")}`
    );
  }

  const [existing] = await db
    .select()
    .from(githubIntegrations)
    .where(eq(githubIntegrations.userId, user.id))
    .limit(1);
  if (existing) {
    await db
      .update(githubIntegrations)
      .set({ accessToken: tokenData.access_token, updatedAt: new Date() })
      .where(eq(githubIntegrations.userId, user.id));
  } else {
    await db.insert(githubIntegrations).values({
      userId: user.id,
      accessToken: tokenData.access_token,
    });
  }

  return NextResponse.redirect(
    `${BASE_URL}/evidence-compiler?email=${encodeURIComponent(email)}&connected=1`
  );
}
