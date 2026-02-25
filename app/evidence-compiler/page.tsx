"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface RepoItem {
  name: string;
  analysis: { credibilityBaseScore: number; languages: string[] };
  narrative: string;
}

export default function EvidenceCompilerPage() {
  const [email, setEmail] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [draft, setDraft] = useState<{ repos: RepoItem[] } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState<{ id: number; title: string }[] | null>(null);

  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  useEffect(() => {
    if (urlParams) {
      const e = urlParams.get("email");
      if (e) setEmail(e);
      const err = urlParams.get("error");
      if (err) setError(decodeURIComponent(err));
    }
  }, [urlParams]);

  const analyze = useCallback(async () => {
    if (!email.trim()) return;
    setError(null);
    setProgress("");
    setDraft(null);
    setRunId(null);
    setLoading(true);

    try {
      const res = await fetch("/api/workflows/evidence-compiler/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to start");
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError("No response stream");
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line) as {
              type: string;
              message?: string;
              runId?: string;
            };
            if (ev.type === "progress" && ev.message) {
              setProgress(ev.message);
            } else if (ev.type === "complete" && ev.runId) {
              setRunId(ev.runId);
              const draftRes = await fetch(
                `/api/workflows/evidence-compiler/draft?runId=${encodeURIComponent(ev.runId)}`
              );
              if (draftRes.ok) {
                const d = await draftRes.json();
                setDraft({ repos: d.repos });
                setSelected(new Set(d.repos.map((_: unknown, i: number) => i)));
              }
            } else if (ev.type === "error" && ev.message) {
              setError(ev.message);
            }
          } catch {
            /* ignore parse errors */
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [email]);

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const approve = async () => {
    if (!draft || !runId) return;
    const items = draft.repos
      .map((r, i) => (selected.has(i) ? { ...r, index: i } : null))
      .filter(Boolean) as (RepoItem & { index: number })[];
    if (items.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workflows/evidence-compiler/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          selected: items.map((r) => ({
            name: r.name,
            narrative: r.narrative,
            credibilityBaseScore: r.analysis.credibilityBaseScore,
            languages: r.analysis.languages ?? [],
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Approval failed");
        return;
      }
      setApproved(json.created ?? []);
      setDraft(null);
      setRunId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const connectGitHub = () => {
    if (!email.trim()) {
      setError("Enter your email first");
      return;
    }
    window.location.href = `/api/auth/github?email=${encodeURIComponent(email.trim())}`;
  };

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Evidence Compiler — GitHub
          </h1>
          <Link
            href="/evidence-vault"
            className="text-sm text-blue-600 hover:underline"
          >
            View vault
          </Link>
        </div>

        <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Your email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-2">
            <button
              onClick={connectGitHub}
              className="rounded-md border border-neutral-300 px-4 py-2 font-medium hover:bg-neutral-50"
            >
              Connect GitHub
            </button>
            <button
              onClick={analyze}
              disabled={loading || !email.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Analyzing…" : "Analyze my repos"}
            </button>
          </div>

          {progress && (
            <p className="text-sm text-neutral-600">{progress}</p>
          )}
        </div>

        {approved && approved.length > 0 && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="font-medium text-green-800">Added to vault:</p>
            <ul className="mt-2 list-inside list-disc text-sm text-green-700">
              {approved.map((a) => (
                <li key={a.id}>{a.title}</li>
              ))}
            </ul>
          </div>
        )}

        {draft && draft.repos.length > 0 && (
          <div className="mt-6 space-y-4">
            <h2 className="font-medium text-neutral-900">Draft — select to add</h2>
            {draft.repos.map((r, i) => (
              <div
                key={r.name}
                className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <label className="flex cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggleSelect(i)}
                  />
                  <span className="font-medium">{r.name}</span>
                  <span className="text-sm text-neutral-500">
                    Score: {r.analysis.credibilityBaseScore}/100
                  </span>
                </label>
                <p className="mt-2 text-sm text-neutral-700">{r.narrative}</p>
              </div>
            ))}
            <button
              onClick={approve}
              disabled={loading || selected.size === 0}
              className="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Add selected to vault
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
