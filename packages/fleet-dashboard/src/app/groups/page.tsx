"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { HubGroup } from "@pandotic/universal-cms/types/hub";

const typeBadge = {
  client: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  internal: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  custom: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
} as const;

export default function GroupsPage() {
  const [groups, setGroups] = useState<HubGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setGroups(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          slug: form.get("slug"),
          description: form.get("description") || undefined,
          group_type: form.get("group_type"),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      setShowForm(false);
      fetchGroups();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create group");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading groups...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-medium text-red-400">
          Error loading groups
        </p>
        <p className="mt-1 text-sm text-red-400/70">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Groups
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {groups.length} {groups.length === 1 ? "group" : "groups"} —
            organize properties into portfolios
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
        >
          {showForm ? "Cancel" : "Create Group"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Name
              </label>
              <input
                name="name"
                required
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
                placeholder="Client Portfolio"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Slug
              </label>
              <input
                name="slug"
                required
                pattern="[a-z0-9-]+"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
                placeholder="client-portfolio"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Type
              </label>
              <select
                name="group_type"
                required
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
              >
                <option value="client">Client</option>
                <option value="internal">Internal</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Description
              </label>
              <input
                name="description"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
                placeholder="Optional description"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {groups.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <h2 className="text-lg font-medium text-zinc-300">
            No groups yet
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Create your first group to organize properties into portfolios.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const tb =
              typeBadge[group.group_type as keyof typeof typeBadge] ??
              typeBadge.custom;

            return (
              <Link
                key={group.id}
                href={`/groups/${group.slug}`}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {group.name}
                    </p>
                    {group.description && (
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tb}`}
                  >
                    {group.group_type}
                  </span>
                </div>
                <p className="mt-3 text-xs text-zinc-600">
                  Created{" "}
                  {new Date(group.created_at).toLocaleDateString()}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
