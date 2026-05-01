"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ActivityIcon, Clock, RefreshCcw } from "lucide-react";
import { relativeTime } from "./matrix-utils";

interface ActivityEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  property_id: string | null;
  created_at: string;
}

const ACTION_COLOR: Record<string, string> = {
  create: "bg-emerald-500",
  update: "bg-blue-500",
  delete: "bg-red-500",
  deploy: "bg-violet-500",
  upgrade: "bg-amber-500",
  run: "bg-cyan-500",
};

function dotColor(action: string) {
  const key = Object.keys(ACTION_COLOR).find((k) => action.toLowerCase().includes(k));
  return key ? ACTION_COLOR[key] : "bg-zinc-600";
}

export function ActivityFeed() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/activity?limit=15")
      .then((r) => r.json())
      .then((body) => { if (body.data) setEntries(body.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <ActivityIcon className="h-4 w-4 text-zinc-500" />
          Recent activity
        </div>
        <button
          onClick={load}
          className="rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
          title="Refresh"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && entries.length === 0 ? (
        <div className="space-y-3 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-zinc-800" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-800" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-zinc-600">No activity yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-800/50">
          {entries.map((entry) => (
            <li key={entry.id} className="flex gap-3 px-4 py-3">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor(entry.action)}`} />
              <div className="min-w-0">
                <p className="text-sm text-zinc-300 leading-snug">
                  {entry.description ?? `${entry.action} on ${entry.entity_type}`}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-600">
                  <Clock className="h-3 w-3" />
                  {relativeTime(entry.created_at)}
                  {entry.property_id && (
                    <>
                      <span>·</span>
                      <Link
                        href="/fleet"
                        className="hover:text-zinc-400"
                      >
                        view fleet
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-zinc-800 px-4 py-2">
        <Link href="/audit-log" className="text-xs text-zinc-600 hover:text-zinc-400">
          View full audit log →
        </Link>
      </div>
    </div>
  );
}
