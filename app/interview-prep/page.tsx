"use client";

import { useState } from "react";
import Link from "next/link";

export default function InterviewPrepPage() {
  const [email, setEmail] = useState("");
  const [roleType, setRoleType] = useState("software_engineer");
  const [company, setCompany] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [problemStatement, setProblemStatement] = useState("");
  const [solution, setSolution] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    scores: { correctness: number; clarity: number; completeness: number; total: number };
    feedback: string;
  } | null>(null);
  const [logged, setLogged] = useState(false);

  const startSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSessionId(null);
    setProblemStatement("");
    setSolution("");
    setLoading(true);
    try {
      const res = await fetch("/api/workflows/interview-prep/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          roleType,
          company: company.trim() || undefined,
          difficulty,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to start");
        return;
      }
      setSessionId(json.sessionId);
      setProblemStatement(json.problemStatement ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const submitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !solution.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/workflows/interview-prep/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, solution: solution.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to submit");
        return;
      }
      setResult({
        scores: json.scores,
        feedback: json.feedback ?? "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const logAsEvidence = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workflows/interview-prep/log-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to log");
        return;
      }
      setLogged(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Interview Prep
          </h1>
          <Link href="/evidence-vault" className="text-sm text-blue-600 hover:underline">
            View vault
          </Link>
        </div>

        {!sessionId ? (
          <form onSubmit={startSession} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Role type</label>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
              >
                <option value="software_engineer">Software Engineer</option>
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Company (optional)</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme"
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Generating…" : "Get practice problem"}
            </button>
          </form>
        ) : (
          <>
            <div className="mb-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <h2 className="font-medium text-neutral-900">Problem</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">{problemStatement}</p>
            </div>

            {!result ? (
              <form onSubmit={submitSolution} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">Your solution</label>
                  <textarea
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    rows={8}
                    required
                    placeholder="Describe your approach, algorithm, and key considerations..."
                    className="w-full rounded-md border border-neutral-300 px-3 py-2"
                  />
                </div>
                {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Scoring…" : "Submit for feedback"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                  <h3 className="font-medium text-neutral-900">Scores</h3>
                  <p className="mt-2 text-sm">
                    Correctness: {result.scores.correctness} | Clarity: {result.scores.clarity} |
                    Completeness: {result.scores.completeness} | Total: {result.scores.total}/100
                  </p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                  <h3 className="font-medium text-neutral-900">Feedback</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">{result.feedback}</p>
                </div>
                {!logged ? (
                  <button
                    onClick={logAsEvidence}
                    disabled={loading}
                    className="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Log as evidence
                  </button>
                ) : (
                  <p className="text-sm text-green-700">✓ Logged to vault</p>
                )}
                <button
                  onClick={() => {
                    setSessionId(null);
                    setProblemStatement("");
                    setSolution("");
                    setResult(null);
                  }}
                  className="ml-2 rounded-md border border-neutral-300 px-4 py-2 font-medium hover:bg-neutral-50"
                >
                  New problem
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
