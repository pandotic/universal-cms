"use client";

import { Bot, Briefcase, Filter, Megaphone, Search, Wrench, type LucideIcon } from "lucide-react";
import type { Density, Lens, OwnerFilter } from "./types";

const LENSES: { id: Lens; label: string; Icon: LucideIcon; hint: string }[] = [
  { id: "ops", label: "Operations", Icon: Wrench, hint: "Health · deploys · uptime" },
  { id: "developer", label: "Developer", Icon: Wrench, hint: "Versions · skills · modules" },
  { id: "marketing", label: "Marketing", Icon: Megaphone, hint: "Services · content · brand" },
  { id: "business", label: "Business", Icon: Briefcase, hint: "Stage · ownership · LLC" },
];

const OWNERS: { id: OwnerFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "personal", label: "Personal" },
  { id: "pandotic", label: "Pandotic" },
  { id: "client", label: "Client" },
];

interface Props {
  lens: Lens;
  onLensChange: (l: Lens) => void;
  owner: OwnerFilter;
  onOwnerChange: (o: OwnerFilter) => void;
  query: string;
  onQueryChange: (q: string) => void;
  density: Density;
  onDensityChange: (d: Density) => void;
  total: number;
  filtered: number;
}

export function MatrixFilters({
  lens, onLensChange, owner, onOwnerChange,
  query, onQueryChange, density, onDensityChange,
  total, filtered,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Lens tabs */}
      <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-1 text-sm">
        {LENSES.map((l) => (
          <button
            key={l.id}
            onClick={() => onLensChange(l.id)}
            title={l.hint}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              lens === l.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <l.Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{l.label}</span>
          </button>
        ))}
      </div>

      {/* Right-side controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Filter properties…"
            className="h-8 rounded-md border border-zinc-800 bg-zinc-900 pl-8 pr-3 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 w-44"
          />
        </div>

        {/* Owner filter */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Filter className="h-3.5 w-3.5" />
          <div className="inline-flex rounded-md border border-zinc-800 bg-zinc-900 p-0.5">
            {OWNERS.map((o) => (
              <button
                key={o.id}
                onClick={() => onOwnerChange(o.id)}
                className={`rounded px-2.5 py-1 transition-colors ${
                  owner === o.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Density */}
        <div className="inline-flex rounded-md border border-zinc-800 bg-zinc-900 p-0.5 text-xs">
          <button
            onClick={() => onDensityChange("compact")}
            className={`rounded px-2 py-1 transition-colors ${density === "compact" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            title="Compact rows"
          >
            ≡
          </button>
          <button
            onClick={() => onDensityChange("comfortable")}
            className={`rounded px-2 py-1 transition-colors ${density === "comfortable" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            title="Comfortable rows"
          >
            ☰
          </button>
        </div>

        {/* Count */}
        {query || owner !== "all" ? (
          <span className="text-xs text-zinc-500">{filtered} / {total}</span>
        ) : (
          <span className="text-xs text-zinc-500">{total} sites</span>
        )}
      </div>
    </div>
  );
}
