import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-6 text-3xl font-bold text-neutral-900">LOCO — Career Operating System</h1>
      <div className="flex gap-4">
        <Link
          href="/onboarding"
          className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Start onboarding
        </Link>
        <Link
          href="/evidence-vault"
          className="rounded-md border border-neutral-300 px-6 py-3 font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Evidence vault
        </Link>
        <Link
          href="/conversation"
          className="rounded-md border border-neutral-300 px-6 py-3 font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Talk to SERGENT
        </Link>
        <Link
          href="/evidence-compiler"
          className="rounded-md border border-neutral-300 px-6 py-3 font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Evidence Compiler (GitHub)
        </Link>
        <Link
          href="/cv-compiler"
          className="rounded-md border border-neutral-300 px-6 py-3 font-medium text-neutral-700 hover:bg-neutral-50"
        >
          CV Compiler
        </Link>
        <Link
          href="/application-researcher"
          className="rounded-md border border-neutral-300 px-6 py-3 font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Application Researcher
        </Link>
        <Link
          href="/interview-prep"
          className="rounded-md border border-neutral-300 px-6 py-3 font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Interview Prep
        </Link>
      </div>
    </main>
  );
}
