"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Clock, X } from "lucide-react";
import { relativeTime } from "@/app/home/matrix-utils";

interface Entry {
  id: string;
  action: string;
  description: string | null;
  created_at: string;
}

const READ_KEY = "hub-notif-read";

function getRead(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveRead(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-200)));
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [read, setRead] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRead(getRead());
    fetch("/api/activity?limit=20")
      .then((r) => r.json())
      .then((b) => { if (b.data) setEntries(b.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const unread = entries.filter((e) => !read.has(e.id)).length;

  function markAllRead() {
    const next = new Set([...read, ...entries.map((e) => e.id)]);
    setRead(next);
    saveRead(next);
  }

  function markRead(id: string) {
    const next = new Set([...read, id]);
    setRead(next);
    saveRead(next);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <span className="text-sm font-medium text-zinc-200">
              Notifications {unread > 0 && <span className="ml-1 rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">{unread} new</span>}
            </span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} title="Mark all read" className="text-zinc-500 hover:text-zinc-300">
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-600">No recent activity.</p>
            ) : (
              <ul className="divide-y divide-zinc-800/50">
                {entries.map((e) => {
                  const isRead = read.has(e.id);
                  return (
                    <li
                      key={e.id}
                      onClick={() => markRead(e.id)}
                      className={`flex gap-3 px-4 py-3 cursor-default transition-colors ${isRead ? "opacity-50" : "hover:bg-zinc-800/50"}`}
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isRead ? "bg-zinc-700" : "bg-violet-400"}`} />
                      <div className="min-w-0">
                        <p className="text-sm text-zinc-300 leading-snug truncate">
                          {e.description ?? `${e.action} event`}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-600">
                          <Clock className="h-3 w-3" />
                          {relativeTime(e.created_at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-zinc-800 px-4 py-2">
            <Link href="/audit-log" onClick={() => setOpen(false)} className="text-xs text-zinc-600 hover:text-zinc-400">
              Full audit log →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
