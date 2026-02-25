import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../lib/db/client";
import { careerPhases, objectives } from "../lib/db/schema";

async function seed() {
  await db
    .insert(careerPhases)
    .values([
      { slug: "education", name: "Education", description: "University, bootcamps, training. Building your foundation." },
      { slug: "early_career", name: "Early Career", description: "Your first 1-3 years. Proving you can do the work." },
      { slug: "mid_career", name: "Mid Career", description: "Years 3-7+. Deepening expertise, building a reputation." },
      { slug: "leadership", name: "Leadership", description: "Managing teams, shaping strategy." },
      { slug: "executive", name: "Executive", description: "C-suite, board-level, organizational transformation." },
      { slug: "legacy", name: "Legacy", description: "Advisory, mentoring, succession, giving back." },
    ])
    .onConflictDoNothing({ target: careerPhases.slug });

  const [earlyCareer] = await db.select().from(careerPhases).where(eq(careerPhases.slug, "early_career")).limit(1);
  if (earlyCareer) {
    await db.insert(objectives).values([
      { phaseId: earlyCareer.id, objectiveText: "Build portfolio evidence that demonstrates full-stack competence", priority: 1, category: "evidence" },
      { phaseId: earlyCareer.id, objectiveText: "Close your system design gap for senior frontend roles", priority: 2, category: "skills" },
    ]);
  }

  console.log("Seed complete.");
}

seed().catch(console.error);
