"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { HubProperty } from "@pandotic/universal-cms/types/hub";

export default function PropertyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [property, setProperty] = useState<HubProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperty() {
      try {
        // Fetch all properties and find by slug (we could add a slug API but this works for now)
        const res = await fetch("/api/properties");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const found = json.data.find(
          (p: HubProperty) => p.slug === slug
        );
        if (!found) throw new Error("Property not found");
        setProperty(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-medium text-red-400">
          {error || "Property not found"}
        </p>
        <Link
          href="/properties"
          className="mt-2 inline-block text-sm text-zinc-400 hover:text-white"
        >
          Back to Properties
        </Link>
      </div>
    );
  }

  const healthColors = {
    healthy: "text-emerald-400",
    degraded: "text-amber-400",
    down: "text-red-400",
    unknown: "text-zinc-400",
  } as const;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/properties"
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            &larr; Properties
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {property.name}
          </h1>
          <a
            href={property.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 hover:text-zinc-400"
          >
            {property.url}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={property.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Open Site
          </a>
          <a
            href={`${property.url.replace(/\/+$/, "")}/admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
          >
            Open CMS Admin
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Type
          </p>
          <p className="mt-1 text-sm font-medium capitalize text-white">
            {property.property_type}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Status
          </p>
          <p className="mt-1 text-sm font-medium capitalize text-white">
            {property.status}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Health
          </p>
          <p
            className={`mt-1 text-sm font-medium capitalize ${healthColors[property.health_status as keyof typeof healthColors] ?? "text-zinc-400"}`}
          >
            {property.health_status}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            SSL
          </p>
          <p
            className={`mt-1 text-sm font-medium ${property.ssl_valid ? "text-emerald-400" : "text-red-400"}`}
          >
            {property.ssl_valid ? "Valid" : "Invalid"}
            {property.ssl_expires_at && (
              <span className="ml-1 text-xs text-zinc-500">
                (expires{" "}
                {new Date(property.ssl_expires_at).toLocaleDateString()})
              </span>
            )}
          </p>
        </div>
      </div>

      {property.enabled_modules.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-medium text-zinc-300">
            Enabled Modules ({property.enabled_modules.length})
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {property.enabled_modules.map((mod) => (
              <span
                key={mod}
                className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300"
              >
                {mod}
              </span>
            ))}
          </div>
        </div>
      )}

      {property.preset && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-medium text-zinc-300">Preset</h2>
          <p className="mt-1 text-sm text-zinc-400">{property.preset}</p>
        </div>
      )}

      {property.last_deploy_at && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-medium text-zinc-300">Last Deploy</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {new Date(property.last_deploy_at).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
