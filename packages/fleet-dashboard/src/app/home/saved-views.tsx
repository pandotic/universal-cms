"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import type { Lens, OwnerFilter } from "./types";

export interface SavedView {
  id: string;
  name: string;
  lens: Lens;
  owner: OwnerFilter;
  query: string;
  createdAt: string;
}

const STORE_KEY = "hub-matrix-saved-views";

function loadViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as SavedView[]) : [];
  } catch {
    return [];
  }
}

function saveViews(views: SavedView[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(views));
}

interface Props {
  currentLens: Lens;
  currentOwner: OwnerFilter;
  currentQuery: string;
  onApply: (view: SavedView) => void;
}

export function SavedViews({ currentLens, currentOwner, currentQuery, onApply }: Props) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => { setViews(loadViews()); }, []);

  function save() {
    if (!name.trim()) return;
    const next = [...views, { id: crypto.randomUUID(), name: name.trim(), lens: currentLens, owner: currentOwner, query: currentQuery, createdAt: new Date().toISOString() }];
    setViews(next);
    saveViews(next);
    setName("");
    setSaving(false);
  }

  function remove(id: string) {
    const next = views.filter((v) => v.id !== id);
    setViews(next);
    saveViews(next);
  }

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-1">
        {views.map((v) => (
          <div key={v.id} className="group flex items-center">
            <button
              onClick={() => onApply(v)}
              className="inline-flex items-center gap-1 rounded-l-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              title={`${v.lens} · ${v.owner}${v.query ? ` · "${v.query}"` : ""}`}
            >
              <BookmarkCheck className="h-3 w-3" />
              {v.name}
            </button>
            <button
              onClick={() => remove(v.id)}
              className="rounded-r-md border border-l-0 border-zinc-700 bg-zinc-900 p-1 text-zinc-600 opacity-0 group-hover:opacity-100 hover:bg-zinc-800 hover:text-red-400 transition-all"
              aria-label={`Delete ${v.name} view`}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}

        {!saving ? (
          <button
            onClick={() => setSaving(true)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
            title="Save current view"
          >
            <Bookmark className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setSaving(false); }}
              placeholder="View name…"
              className="h-7 rounded-l-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-white outline-none focus:border-zinc-500 w-28"
              autoFocus
            />
            <button
              onClick={save}
              disabled={!name.trim()}
              className="h-7 rounded-r-md border border-l-0 border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
            >
              Save
            </button>
            <button onClick={() => setSaving(false)} className="text-xs text-zinc-600 hover:text-zinc-300">✕</button>
          </div>
        )}
      </div>
    </div>
  );
}
