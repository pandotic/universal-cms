'use client';

import Link from 'next/link';

export default function QADashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/marketing-ops" className="text-sm text-zinc-500 hover:text-zinc-300">&larr; Marketing Ops</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">QA & Reviews</h1>
        <p className="mt-1 text-sm text-zinc-400">Content quality assurance, auto-pilot settings, and learning log</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">QA Reviews</p>
          <p className="mt-1 text-2xl font-semibold text-white">—</p>
          <p className="mt-1 text-xs text-zinc-500">Skeptical Reviewer results</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Auto-Pilot</p>
          <p className="mt-1 text-2xl font-semibold text-white">—</p>
          <p className="mt-1 text-xs text-zinc-500">Per-brand confidence thresholds</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Learning Log</p>
          <p className="mt-1 text-2xl font-semibold text-white">—</p>
          <p className="mt-1 text-xs text-zinc-500">Human override feedback</p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
        <p className="text-sm text-amber-400">QA dashboard coming in a future chunk. The API routes and data layer are ready — this page will show pass/fail rates, confidence trends, and the learning log for tuning the Skeptical Reviewer.</p>
      </div>
    </div>
  );
}
