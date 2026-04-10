"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { HubProperty } from "@pandotic/universal-cms/types/hub";

const statusConfig = {
  active: {
    label: "Active",
    badge: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  },
  paused: {
    label: "Paused",
    badge: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  },
  archived: {
    label: "Archived",
    badge: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
  },
  error: {
    label: "Error",
    badge: "bg-red-500/10 text-red-400 ring-red-500/20",
  },
} as const;

const healthDot = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
  unknown: "bg-zinc-500",
} as const;

const typeBadge = {
  site: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  app: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
} as const;

export default function PropertiesPage() {
  const [properties, setProperties] = useState<HubProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      const res = await fetch("/api/properties");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setProperties(json.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load properties"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          slug: form.get("slug"),
          url: form.get("url"),
          property_type: form.get("property_type"),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      setShowForm(false);
      fetchProperties();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create property");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading properties...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-medium text-red-400">
          Error loading properties
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
            Properties
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {properties.length} registered{" "}
            {properties.length === 1 ? "property" : "properties"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
        >
          {showForm ? "Cancel" : "Register Property"}
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
                placeholder="My Site"
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
                placeholder="my-site"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                URL
              </label>
              <input
                name="url"
                type="url"
                required
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Type
              </label>
              <select
                name="property_type"
                required
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
              >
                <option value="site">Site</option>
                <option value="app">App</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
            >
              Register
            </button>
          </div>
        </form>
      )}

      {properties.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <h2 className="text-lg font-medium text-zinc-300">
            No properties registered
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Register your first site or app to start managing your fleet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((prop) => {
            const sc =
              statusConfig[prop.status as keyof typeof statusConfig] ??
              statusConfig.active;
            const hd =
              healthDot[prop.health_status as keyof typeof healthDot] ??
              healthDot.unknown;
            const tb =
              typeBadge[prop.property_type as keyof typeof typeBadge] ??
              typeBadge.site;

            return (
              <div
                key={prop.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/properties/${prop.slug}`}
                      className="truncate text-sm font-medium text-white hover:underline"
                    >
                      {prop.name}
                    </Link>
                    <a
                      href={prop.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block truncate text-xs text-zinc-500 hover:text-zinc-400"
                    >
                      {prop.url}
                    </a>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${sc.badge}`}
                  >
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${hd}`}
                    />
                    {sc.label}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tb}`}
                  >
                    {prop.property_type}
                  </span>
                  {prop.enabled_modules.length > 0 && (
                    <span className="text-xs text-zinc-500">
                      {prop.enabled_modules.length} module
                      {prop.enabled_modules.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {prop.last_deploy_at && (
                    <span className="text-xs text-zinc-600">
                      Deployed{" "}
                      {new Date(prop.last_deploy_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <a
                    href={prop.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-zinc-400 hover:text-white"
                  >
                    Open Site
                  </a>
                  <a
                    href={`${prop.url.replace(/\/+$/, "")}/admin`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-zinc-400 hover:text-white"
                  >
                    Open CMS Admin
                  </a>
                  <Link
                    href={`/properties/${prop.slug}`}
                    className="text-xs font-medium text-zinc-400 hover:text-white"
                  >
                    Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
