'use client';

import Link from 'next/link';

export default function LinkBuildingPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/marketing-ops" className="text-sm text-zinc-500 hover:text-zinc-300">&larr; Marketing Ops</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Link Building</h1>
        <p className="mt-1 text-sm text-zinc-400">Track directory submissions, backlinks, and Featured.com pitches across all brands</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Opportunities</p>
          <p className="mt-1 text-2xl font-semibold text-white">—</p>
          <p className="mt-1 text-xs text-zinc-500">Shared catalog of link opportunities</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Submissions</p>
          <p className="mt-1 text-2xl font-semibold text-white">—</p>
          <p className="mt-1 text-xs text-zinc-500">Per-brand submissions to opportunities</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Featured.com</p>
          <p className="mt-1 text-2xl font-semibold text-white">—</p>
          <p className="mt-1 text-xs text-zinc-500">Outbound pitches and inbound submissions</p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
        <p className="text-sm text-amber-400">Link building command center coming in a future chunk. The API routes and data layer are ready — this page will show opportunity catalogs, per-brand submission matrices, and Featured.com tracking.</p>
      </div>
    </div>
  );
}
