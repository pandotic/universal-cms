"use client";

import { Menu, Search } from "lucide-react";
import { UserMenu } from "./user-menu";
import { NotificationsBell } from "./notifications";

interface Props {
  onOpenSidebar: () => void;
  onOpenPalette: () => void;
  healthSummary?: { healthy: number; degraded: number; down: number };
}

export function TopBar({ onOpenSidebar, onOpenPalette, healthSummary }: Props) {
  const total = (healthSummary?.healthy ?? 0) + (healthSummary?.degraded ?? 0) + (healthSummary?.down ?? 0);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-sm">
      <button
        onClick={onOpenSidebar}
        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search bar → opens palette */}
      <button
        onClick={onOpenPalette}
        className="hidden flex-1 md:flex md:max-w-sm items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-500 hover:border-zinc-700 hover:bg-zinc-800/80 transition-colors cursor-text"
        aria-label="Open command palette"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left truncate">Search or jump to…</span>
        <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* Fleet health pill */}
        {healthSummary && total > 0 && (
          <div className="hidden items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs sm:flex">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {healthSummary.healthy}
            </span>
            {healthSummary.degraded > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {healthSummary.degraded}
              </span>
            )}
            {healthSummary.down > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                {healthSummary.down}
              </span>
            )}
          </div>
        )}

        <NotificationsBell />

        <UserMenu />
      </div>
    </header>
  );
}
