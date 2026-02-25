/**
 * Layer 1: Deterministic company data aggregation.
 * Same company + role ⇒ same data shape.
 * Uses free APIs: GitHub (org), public data.
 */

export interface CompanyData {
  companyName: string;
  targetRole: string;
  techStack: string[];
  announcements: string[];
  teamSize: string | null;
  interviewSignals: string[];
  raw: Record<string, unknown>;
}

/**
 * Deterministic aggregation. Fetches from free sources, normalizes into fixed shape.
 * Same inputs → same output structure (content may vary if APIs update).
 */
export async function aggregateCompanyData(
  companyName: string,
  targetRole: string,
  fetchFn: typeof fetch = fetch
): Promise<CompanyData> {
  const orgSlug = companyName.trim().toLowerCase().replace(/\s+/g, "-");
  const techStack: string[] = [];
  const announcements: string[] = [];
  let teamSize: string | null = null;
  const interviewSignals: string[] = [];
  const raw: Record<string, unknown> = {};

  // GitHub: try to find org
  try {
    const ghRes = await fetchFn(
      `https://api.github.com/orgs/${encodeURIComponent(orgSlug)}`,
      { headers: { Accept: "application/vnd.github.v3+json" } }
    );
    if (ghRes.ok) {
      const org = (await ghRes.json()) as {
        public_repos?: number;
        name?: string;
        description?: string;
      };
      raw.githubOrg = org;
      if (org.public_repos !== undefined) {
        techStack.push(`GitHub org: ${org.public_repos} public repos`);
      }
    }
  } catch {
    /* ignore */
  }

  // Deterministic placeholder when no API keys - still returns consistent structure
  return {
    companyName: companyName.trim(),
    targetRole: targetRole.trim(),
    techStack: techStack.length ? techStack : ["(Limited free data - add API keys for more)"],
    announcements: announcements.length ? announcements : ["(No announcements found)"],
    teamSize,
    interviewSignals: interviewSignals.length ? interviewSignals : ["(Research interview process separately)"],
    raw,
  };
}
