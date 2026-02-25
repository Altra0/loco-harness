import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { evidence } from "@/lib/db/schema";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ evidenceId: string }> }
) {
  try {
    const { evidenceId } = await params;
    const id = parseInt(evidenceId, 10);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await request.json();
    const isShareable = Boolean(body.isShareable);

    await db.update(evidence).set({ isShareable }).where(eq(evidence.id, id));
    return NextResponse.json({ isShareable });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
