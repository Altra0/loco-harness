"use client";

import { useState } from "react";
import Link from "next/link";

export default function ApplicationResearcherPage() {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBriefing(null);
    setLoading(true);
    try {
      const res = await fetch("/api/workflows/application-researcher/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          companyName: companyName.trim(),
          targetRole: targetRole.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to research");
        return;
      }
      setBriefing(json.briefing ?? null);
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
            Application Researcher
          </h1>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:underline"
          >
            Home
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Your email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Company name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Inc"
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Target role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Software Engineer"
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Researching…" : "Get interview briefing"}
          </button>
        </form>

        {briefing && (
          <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-medium text-neutral-900">Interview Briefing</h2>
            <div className="whitespace-pre-wrap text-sm text-neutral-700">
              {briefing}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
