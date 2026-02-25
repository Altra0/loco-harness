"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email("Invalid email"),
  type: z.enum(["project", "credential", "achievement"]),
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  links: z.string().optional(),
  hasPublicRepo: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface EvidenceItem {
  id: number;
  type: string;
  title: string;
  description: string | null;
  credibilityScore: number | null;
  skillTags: string[];
  isShareable: boolean;
  shareToken: string | null;
}

export default function EvidenceVaultPage() {
  const [email, setEmail] = useState("");
  const [vault, setVault] = useState<EvidenceItem[]>([]);
  const [acknowledgment, setAcknowledgment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", type: "project", title: "", description: "", links: "", hasPublicRepo: false },
  });

  const fetchVault = async (userEmail: string) => {
    try {
      const res = await fetch(`/api/evidence/vault?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setVault(data);
      } else {
        setVault([]);
      }
    } catch {
      setVault([]);
    }
  };

  const onSubmit = async (data: FormData) => {
    setError(null);
    setAcknowledgment(null);
    try {
      const links = data.links ? data.links.split(",").map((s) => s.trim()).filter(Boolean) : [];
      const res = await fetch("/api/evidence/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          type: data.type,
          title: data.title,
          description: data.description,
          links,
          hasPublicRepo: data.hasPublicRepo,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || json.error || "Submission failed");
        return;
      }
      setEmail(data.email);
      await fetchVault(data.email);

      const ackRes = await fetch("/api/evidence/acknowledgment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          score: json.score,
          skill_tags: json.skill_tags ?? [],
        }),
      });
      const ackData = await ackRes.json();
      setAcknowledgment(ackData.acknowledgment ?? null);
      reset({ ...data, title: "", description: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-2xl font-semibold text-neutral-900">Evidence Vault</h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
              Your email
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="type" className="mb-1 block text-sm font-medium text-neutral-700">
              Type
            </label>
            <select id="type" {...register("type")} className="w-full rounded-md border border-neutral-300 px-3 py-2">
              <option value="project">Project</option>
              <option value="credential">Credential</option>
              <option value="achievement">Achievement</option>
            </select>
          </div>

          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-neutral-700">
              Title
            </label>
            <input id="title" {...register("title")} className="w-full rounded-md border border-neutral-300 px-3 py-2" />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-neutral-700">
              Description
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={3}
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="links" className="mb-1 block text-sm font-medium text-neutral-700">
              Links (comma-separated)
            </label>
            <input id="links" {...register("links")} className="w-full rounded-md border border-neutral-300 px-3 py-2" placeholder="https://github.com/..." />
          </div>

          <div className="flex items-center gap-2">
            <input id="hasPublicRepo" type="checkbox" {...register("hasPublicRepo")} />
            <label htmlFor="hasPublicRepo" className="text-sm text-neutral-700">
              Has public repo
            </label>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {acknowledgment && <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">{acknowledgment}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Submitting…" : "Add to vault"}
          </button>
        </form>

        <div className="space-y-3">
          <h2 className="font-medium text-neutral-900">Your evidence</h2>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter email to view vault"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => email && fetchVault(email)}
              className="rounded-md bg-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-300"
            >
              Load vault
            </button>
          </div>
          {vault.length === 0 ? (
            <p className="text-neutral-500">No evidence yet. Submit above to add.</p>
          ) : (
            vault.map((e) => (
              <div
                key={e.id}
                className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="flex justify-between">
                  <h3 className="font-medium text-neutral-900">{e.title}</h3>
                  <span className="text-sm font-medium text-neutral-600">
                    Score: {e.credibilityScore ?? "—"}/100
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-600">{e.description}</p>
                {e.skillTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {e.skillTags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      defaultChecked={e.isShareable}
                      onChange={async (ev) => {
                        await fetch(`/api/evidence/${e.id}/share`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ isShareable: ev.target.checked }),
                        });
                        if (email) fetchVault(email);
                      }}
                    />
                    Shareable
                  </label>
                  {e.isShareable && e.shareToken && (
                    <span className="text-xs text-neutral-500">
                      /api/evidence/shared/{e.shareToken}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
