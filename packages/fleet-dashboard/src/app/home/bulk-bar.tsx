"use client";

import Link from "next/link";
import { Play, RefreshCcw, Rocket, X } from "lucide-react";

interface Props {
  count: number;
  selectedIds: string[];
  onClear: () => void;
  onDeploySkill: () => void;
}

export function BulkBar({ count, selectedIds, onClear, onDeploySkill }: Props) {
  const idsParam = encodeURIComponent(selectedIds.join(","));

  return (
    <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 shadow-2xl shadow-black/60 ring-1 ring-white/5">
        <span className="mr-1 text-sm text-zinc-300">
          <span className="font-semibold text-white">{count}</span> selected
        </span>
        <span className="h-4 w-px bg-zinc-700" />

        <button
          onClick={onDeploySkill}
          className="inline-flex items-center gap-1.5 rounded-full bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-400 transition-colors"
        >
          <Rocket className="h-3.5 w-3.5" />
          Deploy skill
        </button>

        <Link
          href={`/fleet/deploy?properties=${idsParam}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Upgrade CMS
        </Link>

        <Link
          href={`/agents?properties=${idsParam}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
        >
          <Play className="h-3.5 w-3.5" />
          Run agent
        </Link>

        <span className="h-4 w-px bg-zinc-700" />
        <button
          onClick={onClear}
          className="rounded-full p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
          aria-label="Clear selection"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
