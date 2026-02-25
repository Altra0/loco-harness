/**
 * Layer 1: Deterministic interview prep logic.
 * Same inputs ⇒ same template and score.
 */

export interface ProblemTemplate {
  id: number;
  roleType: string;
  difficulty: string;
  templateText: string;
  rubricJson: string;
}

export interface RubricScores {
  correctness: number;
  clarity: number;
  completeness: number;
  total: number;
}

/**
 * Deterministic rubric scoring. Same solution text ⇒ same scores.
 */
export function scoreSolution(
  solution: string,
  rubricWeights: { correctness: number; clarity: number; completeness: number } = {
    correctness: 40,
    clarity: 30,
    completeness: 30,
  }
): RubricScores {
  const text = solution.trim();
  const len = text.length;

  let correctness = 50;
  if (len >= 200) correctness += 25;
  else if (len >= 100) correctness += 15;
  else if (len >= 50) correctness += 5;
  if (/\b(algorithm|approach|solution|implement)\b/i.test(text)) correctness += 15;
  if (/\b(O\(|time|space|complexity)\b/i.test(text)) correctness += 10;

  let clarity = 50;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length;
  if (sentences >= 3) clarity += 25;
  else if (sentences >= 1) clarity += 10;
  if (/first|then|finally|step/i.test(text)) clarity += 15;

  let completeness = 50;
  if (len >= 150) completeness += 30;
  else if (len >= 80) completeness += 20;
  else if (len >= 40) completeness += 10;

  correctness = Math.min(100, correctness);
  clarity = Math.min(100, clarity);
  completeness = Math.min(100, completeness);

  const total = Math.round(
    (correctness * rubricWeights.correctness +
      clarity * rubricWeights.clarity +
      completeness * rubricWeights.completeness) /
      100
  );

  return {
    correctness,
    clarity,
    completeness,
    total: Math.min(100, total),
  };
}

/**
 * Deterministic template selection. Seed by date + role + difficulty + company.
 */
export function getTemplateSeed(
  roleType: string,
  difficulty: string,
  company: string,
  dateStr: string
): number {
  const str = `${dateStr}-${roleType}-${difficulty}-${company}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}
