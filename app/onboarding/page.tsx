"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email("Invalid email"),
  yearsExperience: z.number().min(0, "Must be 0 or more"),
  degreeType: z.string().min(1, "Required"),
  internshipCount: z.number().min(0, "Must be 0 or more"),
});

type FormData = z.infer<typeof formSchema>;

interface ClassifyResponse {
  phase: string;
  phase_id: number;
  phase_name: string;
  phase_description: string;
  objective_ids: number[];
  objectives: { id: number; objectiveText: string; priority: number }[];
}

export default function OnboardingPage() {
  const [result, setResult] = useState<ClassifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      yearsExperience: 0,
      degreeType: "bachelors",
      internshipCount: 0,
    },
  });

  const [greeting, setGreeting] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/onboarding/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          yearsExperience: Number(data.yearsExperience),
          degreeType: data.degreeType,
          internshipCount: Number(data.internshipCount),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || json.error || "Classification failed");
        return;
      }
      setResult(json);
      const greetingRes = await fetch("/api/onboarding/greeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase_name: json.phase_name }),
      });
      const greetingData = await greetingRes.json();
      setGreeting(greetingData.greeting ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-2xl font-semibold text-neutral-900">
          Career Phase Classification
        </h1>

        {!result ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="yearsExperience"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Years of experience
              </label>
              <input
                id="yearsExperience"
                type="number"
                min={0}
                {...register("yearsExperience", { valueAsNumber: true })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.yearsExperience && (
                <p className="mt-1 text-sm text-red-600">{errors.yearsExperience.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="degreeType" className="mb-1 block text-sm font-medium text-neutral-700">
                Degree type
              </label>
              <select
                id="degreeType"
                {...register("degreeType")}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="bachelors">Bachelors</option>
                <option value="masters">Masters</option>
                <option value="phd">PhD</option>
                <option value="bootcamp">Bootcamp</option>
                <option value="none">None</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="internshipCount"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Number of internships
              </label>
              <input
                id="internshipCount"
                type="number"
                min={0}
                {...register("internshipCount", { valueAsNumber: true })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.internshipCount && (
                <p className="mt-1 text-sm text-red-600">{errors.internshipCount.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Classifying…" : "Classify my phase"}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900">
                Your Career Phase: {result.phase_name}
              </h2>
              <p className="mt-2 text-neutral-600">{result.phase_description}</p>
            </div>

            {greeting ? (
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="text-neutral-700">{greeting}</p>
              </div>
            ) : result ? (
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="text-neutral-500">Loading greeting…</p>
              </div>
            ) : null}

            <div className="space-y-3">
              <h3 className="font-medium text-neutral-900">Your first two objectives</h3>
              {result.objectives.map((obj) => (
                <div
                  key={obj.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-neutral-800">{obj.objectiveText}</p>
                  <span className="mt-2 inline-block text-sm text-neutral-500">
                    Priority {obj.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
