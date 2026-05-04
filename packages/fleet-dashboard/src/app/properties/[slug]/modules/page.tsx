"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { HubProperty } from "@pandotic/universal-cms/types/hub";
import {
  MODULE_MIGRATIONS,
  modulePresets,
  type CmsModuleName,
} from "@pandotic/universal-cms/config";
import {
  type AdminLayerKey,
  getAdminLayer,
  getAdminModulesByLayer,
} from "@pandotic/universal-cms/admin/modules";

type LayerKey = AdminLayerKey;

interface ModulesResponse {
  data: {
    id: string;
    slug: string;
    enabled_modules: string[];
    preset: string | null;
    package_version: string | null;
    target_package_version: string | null;
    last_module_sync_at: string | null;
  };
}

const LAYER_ORDER: LayerKey[] = ["marketing-cms", "app-admin", "group-admin"];

const PRESET_KEYS = ["appMarketing", "blog", "directory", "full"] as const;
type PresetKey = (typeof PRESET_KEYS)[number];

export default function PropertyModulesPage() {
  const { slug } = useParams<{ slug: string }>();
  const [property, setProperty] = useState<HubProperty | null>(null);
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [targetVersion, setTargetVersion] = useState("");
  const [preset, setPreset] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/properties");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const found = (json.data as HubProperty[]).find((p) => p.slug === slug);
        if (!found) throw new Error("Property not found");
        setProperty(found);

        const modsRes = await fetch(`/api/properties/${found.id}/modules`);
        if (!modsRes.ok) throw new Error(`HTTP ${modsRes.status}`);
        const modsJson = (await modsRes.json()) as ModulesResponse;
        setEnabled(new Set(modsJson.data.enabled_modules ?? []));
        setTargetVersion(modsJson.data.target_package_version ?? "");
        setPreset(modsJson.data.preset ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  function toggle(mod: string) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });
    setMessage(null);
  }

  function applyPreset(key: PresetKey) {
    const p = modulePresets[key];
    setEnabled(new Set(p.modules));
    setPreset(key);
    setMessage(null);
  }

  async function save() {
    if (!property) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/properties/${property.id}/modules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled_modules: Array.from(enabled).sort(),
          preset: preset || null,
          target_package_version: targetVersion || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setMessage("Saved. Site will pick up changes on next sync.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const requiredMigrations = useMemo(() => {
    const set = new Set<string>();
    for (const mod of enabled) {
      (MODULE_MIGRATIONS[mod as CmsModuleName] ?? []).forEach((m) => set.add(m));
    }
    return [...set].sort();
  }, [enabled]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  if (error && !property) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-medium text-red-400">{error}</p>
        <Link
          href="/properties"
          className="mt-2 inline-block text-sm text-zinc-400 hover:text-white"
        >
          Back to Properties
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/properties/${slug}`}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          &larr; {property?.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Modules
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Hub is the source of truth. Toggle modules here; the consuming site
          picks them up on next build.
        </p>
      </div>

      {/* Preset quick-apply */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Presets
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESET_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                preset === key
                  ? "border-white bg-white text-zinc-900"
                  : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {modulePresets[key].name}
            </button>
          ))}
        </div>
        {preset && (
          <p className="mt-2 text-xs text-zinc-500">
            {modulePresets[preset as PresetKey]?.description}
          </p>
        )}
      </div>

      {/* Version controls */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Package version
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-zinc-400">Currently deployed</label>
            <div className="mt-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-300">
              {property?.package_version ?? "unknown"}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400">
              Target version (operator sets)
            </label>
            <input
              type="text"
              value={targetVersion}
              onChange={(e) => setTargetVersion(e.target.value)}
              placeholder="e.g. 0.5.0"
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Sites can be on different versions independently. Bump this when you
          want a property to pull a newer package on its next deploy.
        </p>
      </div>

      {/* Module groups */}
      {LAYER_ORDER.map((layer) => {
        const meta = getAdminLayer(layer);
        const layerModules = getAdminModulesByLayer(layer);
        return (
          <div
            key={layer}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60"
          >
            <div className="border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">{meta.title}</h2>
              <p className="mt-0.5 text-xs text-zinc-500">{meta.description}</p>
            </div>
            <ul className="divide-y divide-zinc-800/70">
              {layerModules.map((mod) => {
                const migrations =
                  MODULE_MIGRATIONS[mod.id as CmsModuleName] ?? [];
                const isOn = enabled.has(mod.id);
                return (
                  <li key={mod.id} className="flex items-start gap-3 px-4 py-3">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isOn}
                        onChange={() => toggle(mod.id)}
                        className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-950 text-white accent-white"
                      />
                      <div>
                        <div className="text-sm font-medium text-zinc-100">
                          {mod.label}
                          <span className="ml-2 font-mono text-xs text-zinc-500">
                            {mod.id}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {mod.description}
                        </p>
                        {migrations.length > 0 && (
                          <p className="mt-1 font-mono text-[10px] text-zinc-600">
                            Migrations: {migrations.join(", ")}
                          </p>
                        )}
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {/* Migration summary */}
      {requiredMigrations.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Required migrations ({requiredMigrations.length})
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {requiredMigrations.map((m) => (
              <span
                key={m}
                className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-300"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Save bar */}
      <div className="sticky bottom-4 flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/95 p-4 backdrop-blur">
        <div className="text-xs text-zinc-400">
          {enabled.size} module{enabled.size === 1 ? "" : "s"} enabled
          {error && (
            <span className="ml-3 text-red-400">{error}</span>
          )}
          {message && (
            <span className="ml-3 text-emerald-400">{message}</span>
          )}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-white px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
        >
          {saving ? "Saving\u2026" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
