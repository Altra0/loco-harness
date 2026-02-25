/**
 * Evidence Scorer — Layer 1 Deterministic Logic
 * Same evidence always produces same score. No AI involved.
 */

export type EvidenceType = "project" | "credential" | "achievement";

export interface EvidenceInput {
  type: EvidenceType;
  title: string;
  description?: string;
  links?: string[];
  hasPublicRepo?: boolean;
  hasDates?: boolean;
}

/**
 * Base scores by type (0-100 scale)
 */
const BASE_SCORES: Record<EvidenceType, number> = {
  project: 40,
  credential: 35,
  achievement: 30,
};

/**
 * Deterministic scoring: evidence with dates, links, public repos scores higher.
 * Same input => same output.
 */
export function scoreEvidence(input: EvidenceInput): number {
  let score = BASE_SCORES[input.type];

  if (input.hasDates) score += 15;
  if (input.links && input.links.length > 0) score += 10;
  if (input.hasPublicRepo) score += 20;

  return Math.min(100, Math.max(0, score));
}

/**
 * Extract skill tags from description using keyword rules (deterministic)
 */
export function extractSkillTags(description: string): string[] {
  const tags: string[] = [];
  const lower = description.toLowerCase();

  const keywordMap: Record<string, string> = {
    "machine learning": "ML",
    "machine-learning": "ML",
    "team lead": "leadership",
    "teamlead": "leadership",
    leadership: "leadership",
    react: "React",
    typescript: "TypeScript",
    "node.js": "Node.js",
    python: "Python",
    "full-stack": "Full-stack",
    "full stack": "Full-stack",
  };

  for (const [keyword, tag] of Object.entries(keywordMap)) {
    if (lower.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags;
}
