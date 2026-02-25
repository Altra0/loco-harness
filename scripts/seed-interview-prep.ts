import "dotenv/config";
import { db } from "../lib/db/client";
import { interviewPrepProblems } from "../lib/db/schema";

const templates = [
  {
    roleType: "software_engineer",
    difficulty: "easy",
    templateText: "Implement a function that reverses a string. Consider edge cases like empty strings and single characters.",
    rubricJson: JSON.stringify({ correctness: 40, clarity: 30, completeness: 30 }),
  },
  {
    roleType: "software_engineer",
    difficulty: "medium",
    templateText: "Design a rate limiter. Explain your approach, data structures, and handle concurrent requests.",
    rubricJson: JSON.stringify({ correctness: 40, clarity: 30, completeness: 30 }),
  },
  {
    roleType: "frontend",
    difficulty: "medium",
    templateText: "Build a debounced search input. Discuss accessibility, performance, and testing strategy.",
    rubricJson: JSON.stringify({ correctness: 40, clarity: 30, completeness: 30 }),
  },
  {
    roleType: "backend",
    difficulty: "medium",
    templateText: "Design an API for a todo list with priorities. Cover REST design, validation, and scaling considerations.",
    rubricJson: JSON.stringify({ correctness: 40, clarity: 30, completeness: 30 }),
  },
];

async function seed() {
  for (const t of templates) {
    await db.insert(interviewPrepProblems).values(t);
  }
  console.log("Interview prep templates seeded.");
}

seed().catch(console.error);
