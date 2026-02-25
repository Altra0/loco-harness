import { eq } from "drizzle-orm";
import { db } from "./client";
import { careerPhases, objectives, users } from "./schema";

export async function getPhaseBySlug(slug: string) {
  const [phase] = await db.select().from(careerPhases).where(eq(careerPhases.slug, slug)).limit(1);
  return phase;
}

export async function getObjectivesForPhase(phaseId: number) {
  return db.select().from(objectives).where(eq(objectives.phaseId, phaseId)).orderBy(objectives.priority);
}

export async function createOrUpdateUserPhase(userId: number, phaseId: number) {
  await db.update(users).set({ careerPhase: String(phaseId) }).where(eq(users.id, userId));
}
