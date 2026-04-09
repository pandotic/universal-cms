"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import type { HubGroup, HubProperty, HubUser, HubUserGroupAccess } from "@pandotic/universal-cms/types/hub";

const typeBadge = {
  client: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  internal: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  custom: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
} as const;

const healthDot = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
  unknown: "bg-zinc-500",
} as const;

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [group, setGroup] = useState<HubGroup | null>(null);
  const [properties, setProperties] = useState<HubProperty[]>([]);
  const [members, setMembers] = useState<HubUserGroupAccess[]>([]);
  const [allProperties, setAllProperties] = useState<HubProperty[]>([]);
  const [allUsers, setAllUsers] = useState<HubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    fetchGroup();
  }, [slug]);

  async function fetchGroup() {
    try {
      // First get group by slug via the list endpoint and find it
      const groupsRes = await fetch("/api/groups");
      if (!groupsRes.ok) throw new Error(`HTTP ${groupsRes.status}`);
      const groupsJson = await groupsRes.json();
      const found = (groupsJson.data as HubGroup[]).find(
        (g) => g.slug === slug
      );
      if (!found) throw new Error("Group not found");
      setGroup(found);

      // Fetch group properties and members in parallel
      const [propsRes, membersRes] = await Promise.all([
        fetch(`/api/groups/${found.id}/properties`),
        fetch(`/api/groups/${found.id}/members`),
      ]);

      if (propsRes.ok) {
        const propsJson = await propsRes.json();
        setProperties(propsJson.data);
      }
      if (membersRes.ok) {
        const membersJson = await membersRes.json();
        setMembers(membersJson.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load group");
    } finally {
      setLoading(false);
    }
  }

  async function loadAllProperties() {
    const res = await fetch("/api/properties");
    if (res.ok) {
      const json = await res.json();
      setAllProperties(json.data);
    }
    setShowAddProperty(true);
  }

  async function loadAllUsers() {
    const res = await fetch("/api/users");
    if (res.ok) {
      const json = await res.json();
      setAllUsers(json.data);
    }
    setShowAddMember(true);
  }

  async function handleAddProperty(propertyId: string) {
    if (!group) return;
    try {
      const res = await fetch(`/api/groups/${group.id}/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setShowAddProperty(false);
      fetchGroup();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to add property"
      );
    }
  }

  async function handleRemoveProperty(propertyId: string) {
    if (!group) return;
    try {
      const res = await fetch(`/api/groups/${group.id}/properties`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchGroup();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to remove property"
      );
    }
  }

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!group) return;
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/groups/${group.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: form.get("user_id"),
          role: form.get("role"),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setShowAddMember(false);
      fetchGroup();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add member");
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!group) return;
    try {
      const res = await fetch(`/api/groups/${group.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchGroup();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to remove member"
      );
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading group...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-medium text-red-400">
          {error || "Group not found"}
        </p>
        <Link
          href="/groups"
          className="mt-4 inline-block text-sm text-zinc-400 hover:text-white"
        >
          Back to Groups
        </Link>
      </div>
    );
  }

  const tb =
    typeBadge[group.group_type as keyof typeof typeBadge] ?? typeBadge.custom;

  const assignedPropertyIds = new Set(properties.map((p) => p.id));
  const availableProperties = allProperties.filter(
    (p) => !assignedPropertyIds.has(p.id)
  );

  const assignedUserIds = new Set(members.map((m) => m.user_id));
  const availableUsers = allUsers.filter(
    (u) => !assignedUserIds.has(u.id)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/groups"
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          Groups
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        <span className="text-sm text-zinc-300">{group.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {group.name}
          </h1>
          {group.description && (
            <p className="mt-1 text-sm text-zinc-500">{group.description}</p>
          )}
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tb}`}
        >
          {group.group_type}
        </span>
      </div>

      {/* Properties Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">
            Properties ({properties.length})
          </h2>
          <button
            onClick={loadAllProperties}
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            Add Property
          </button>
        </div>

        {showAddProperty && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
            <p className="text-sm font-medium text-zinc-300">
              Select a property to add:
            </p>
            {availableProperties.length === 0 ? (
              <p className="text-sm text-zinc-500">
                All properties are already assigned to this group.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableProperties.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAddProperty(p.id)}
                    className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowAddProperty(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        )}

        {properties.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="text-sm text-zinc-500">
              No properties assigned to this group yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-900">
            {properties.map((prop) => {
              const hd =
                healthDot[prop.health_status as keyof typeof healthDot] ??
                healthDot.unknown;

              return (
                <div
                  key={prop.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${hd}`}
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/properties/${prop.slug}`}
                        className="text-sm font-medium text-white hover:underline"
                      >
                        {prop.name}
                      </Link>
                      <p className="truncate text-xs text-zinc-500">
                        {prop.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`${prop.url.replace(/\/+$/, "")}/admin`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-zinc-400 hover:text-white"
                    >
                      CMS Admin
                    </a>
                    <button
                      onClick={() => handleRemoveProperty(prop.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Members Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">
            Members ({members.length})
          </h2>
          <button
            onClick={loadAllUsers}
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            Add Member
          </button>
        </div>

        {showAddMember && (
          <form
            onSubmit={handleAddMember}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  User
                </label>
                <select
                  name="user_id"
                  required
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
                >
                  {availableUsers.length === 0 ? (
                    <option value="">No available users</option>
                  ) : (
                    availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.display_name} ({u.email})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Role
                </label>
                <select
                  name="role"
                  required
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="group_admin">Group Admin</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={availableUsers.length === 0}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {members.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="text-sm text-zinc-500">
              No members assigned to this group yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-900">
            {members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {m.user_id}
                  </p>
                  <p className="text-xs text-zinc-500">Role: {m.role}</p>
                </div>
                <button
                  onClick={() => handleRemoveMember(m.user_id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
