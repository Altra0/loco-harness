/**
 * Layer 1: Deterministic CV structure.
 * Same user + targetRole + evidence ⇒ same structure.
 */

export interface EvidenceItem {
  id: number;
  type: string;
  title: string;
  description: string | null;
  credibilityScore: number | null;
  skillTags: string[];
}

export interface CVSection {
  type: "experience" | "education" | "skills" | "projects";
  title: string;
  items: Array<{
    title: string;
    subtitle?: string;
    bullets: string[];
    score?: number;
  }>;
}

export interface CVStructure {
  role: string;
  company?: string;
  headline: string;
  sections: CVSection[];
  skillsSummary: string[];
}

/**
 * Deterministic ranking: higher score first, then by type priority.
 */
export function structureCV(
  targetRole: string,
  targetCompany: string | undefined,
  evidence: EvidenceItem[]
): CVStructure {
  const role = targetRole.trim() || "Professional";
  const company = targetCompany?.trim();

  const experience: CVSection["items"] = [];
  const projects: CVSection["items"] = [];
  const education: CVSection["items"] = [];

  const scored = evidence.map((e) => ({
    ...e,
    score: e.credibilityScore ?? 0,
  }));
  scored.sort((a, b) => b.score - a.score);

  for (const e of scored) {
    const bullets = e.description
      ? e.description.split(/\n|\.(?=\s)/).filter(Boolean).slice(0, 3).map((s) => s.trim() + ".")
      : [];
    const item = {
      title: e.title,
      subtitle: e.type,
      bullets: bullets.length ? bullets : [e.title],
      score: e.score,
    };
    if (e.type === "credential") education.push(item);
    else if (e.type === "project") projects.push(item);
    else experience.push(item);
  }

  const skillsSet = new Set<string>();
  for (const e of evidence) {
    for (const t of e.skillTags ?? []) {
      if (t) skillsSet.add(t);
    }
  }
  const skillsSummary = Array.from(skillsSet).slice(0, 15);

  const headline = company
    ? `${role} at ${company}`
    : role;

  const sections: CVSection[] = [];
  if (experience.length) sections.push({ type: "experience", title: "Experience", items: experience });
  if (projects.length) sections.push({ type: "projects", title: "Projects", items: projects });
  if (education.length) sections.push({ type: "education", title: "Education & Credentials", items: education });
  if (skillsSummary.length) sections.push({ type: "skills", title: "Skills", items: [{ title: "", bullets: skillsSummary }] });

  return {
    role,
    company,
    headline,
    sections,
    skillsSummary,
  };
}
