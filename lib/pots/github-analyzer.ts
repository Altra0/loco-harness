/**
 * Layer 1: Deterministic repo analysis.
 * Same repo data ⇒ same result.
 */
export interface RepoInput {
  name: string;
  full_name?: string;
  stargazers_count?: number;
  language?: string | null;
  languages?: Record<string, number>;
  fork?: boolean;
  default_branch?: string;
  commit_count?: number;
  contents?: string[];
  readme?: string;
  // from GitHub API or passed in
}

export interface RepoAnalysis {
  name: string;
  stars: number;
  languages: string[];
  isFork: boolean;
  commitCount: number;
  hasTests: boolean;
  isDeployed: boolean;
  credibilityBaseScore: number;
}

/**
 * Infer has_tests from repo structure (common test dirs). Deterministic.
 */
function inferHasTests(repo: RepoInput): boolean {
  const contents = repo.contents ?? [];
  const testIndicators = [
    "test",
    "tests",
    "__tests__",
    "spec",
    "specs",
    ".test.",
    ".spec.",
  ];
  return contents.some((path) =>
    testIndicators.some((ind) => path.toLowerCase().includes(ind))
  );
}

/**
 * Infer is_deployed from common deployment hints. Deterministic.
 */
function inferIsDeployed(repo: RepoInput): boolean {
  const readme = repo.readme ?? "";
  const deployedIndicators = [
    "vercel.app",
    "netlify.app",
    "heroku",
    "railway",
    "deployed",
    "github.io",
    "production",
  ];
  return deployedIndicators.some((ind) =>
    readme.toLowerCase().includes(ind.toLowerCase())
  );
}

/**
 * Compute credibility base score (0-100) from repo metrics. Deterministic.
 */
export function analyzeRepo(repo: RepoInput): RepoAnalysis {
  const stars = repo.stargazers_count ?? 0;
  const langs: string[] = repo.language
    ? [repo.language]
    : repo.languages
      ? Object.keys(repo.languages).sort(
          (a, b) => (repo.languages![b] ?? 0) - (repo.languages![a] ?? 0)
        )
      : [];
  const isFork = repo.fork ?? false;
  const commitCount = repo.commit_count ?? 0;
  const hasTests = inferHasTests(repo);
  const isDeployed = inferIsDeployed(repo);

  let score = 20; // base
  if (stars >= 100) score += 25;
  else if (stars >= 10) score += 15;
  else if (stars >= 1) score += 5;
  if (langs.length > 0) score += 10;
  if (!isFork) score += 10;
  if (commitCount >= 50) score += 15;
  else if (commitCount >= 10) score += 10;
  if (hasTests) score += 10;
  if (isDeployed) score += 10;

  score = Math.min(100, score);

  return {
    name: repo.full_name ?? repo.name,
    stars,
    languages: langs,
    isFork,
    commitCount,
    hasTests,
    isDeployed,
    credibilityBaseScore: score,
  };
}
