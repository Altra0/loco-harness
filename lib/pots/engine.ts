/**
 * POTS Engine — Layer 1 Deterministic Logic
 * Same input always produces same output. Unit-testable, reproducible.
 */

export type CareerPhase = "early_career" | "mid_career" | "leadership" | "executive" | "legacy" | "education";

export interface ClassifyInput {
  yearsExperience: number;
  degreeType: string;
  internshipCount: number;
}

/**
 * Pure function: classifies career phase based on input.
 * Early Career = 0-2 years OR (0 years + at least one internship)
 */
export function classifyCareerPhase(input: ClassifyInput): CareerPhase {
  const { yearsExperience, internshipCount } = input;

  if (yearsExperience <= 2 || (yearsExperience === 0 && internshipCount > 0)) {
    return "early_career";
  }
  if (yearsExperience <= 7) {
    return "mid_career";
  }
  if (yearsExperience <= 12) {
    return "leadership";
  }
  if (yearsExperience <= 25) {
    return "executive";
  }
  return "legacy";
}
