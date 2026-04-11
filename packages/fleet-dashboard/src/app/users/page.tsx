"use client";

import { useEffect, useState } from "react";
import type { HubUser, HubRole } from "@pandotic/universal-cms/types/hub";

const roleBadge: Record<HubRole, string> = {
  super_admin: "bg-red-500/10 text-red-400 ring-red-500/20",
  group_admin: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  member: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  viewer: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
};

const roleLabel: Record<HubRole, string> = {
  super_admin: "Super Admin",
  group_admin: "Group Admin",
  member: "Member",
  viewer: "Viewer",
};

export default function UsersPage() {
  const [users, setUsers] = useState<HubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setUsers(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: HubRole) {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, hub_role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-medium text-red-400">
          Error loading users
        </p>
        <p className="mt-1 text-sm text-red-400/70">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Users
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {users.length} {users.length === 1 ? "user" : "users"} — manage
          platform access and roles
        </p>
      </div>

      {users.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <h2 className="text-lg font-medium text-zinc-300">No users yet</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Users are created automatically when they first sign in.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 border-b border-zinc-800 px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Last Active</span>
          </div>
          <div className="divide-y divide-zinc-800">
            {users.map((user) => {
              const badge = roleBadge[user.hub_role] ?? roleBadge.viewer;
              const label = roleLabel[user.hub_role] ?? user.hub_role;

              return (
                <div
                  key={user.id}
                  className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {user.display_name}
                    </p>
                  </div>
                  <p className="truncate text-sm text-zinc-400">
                    {user.email}
                  </p>
                  <div>
                    {editingId === user.id ? (
                      <select
                        defaultValue={user.hub_role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value as HubRole)
                        }
                        onBlur={() => setEditingId(null)}
                        autoFocus
                        className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 focus:border-zinc-500 focus:outline-none"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="group_admin">Group Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingId(user.id)}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-opacity hover:opacity-80 ${badge}`}
                        title="Click to change role"
                      >
                        {label}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 whitespace-nowrap">
                    {user.last_active_at
                      ? new Date(user.last_active_at).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
