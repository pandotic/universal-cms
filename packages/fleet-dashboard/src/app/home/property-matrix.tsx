"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Plus, RefreshCcw, RefreshCw, X } from "lucide-react";
import { AttentionStrip } from "./attention-strip";
import { MatrixFilters } from "./matrix-filters";
import { PropertyPeek } from "./property-peek";
import { PropertyRow, SortableTh, type RowHandlers } from "./property-row";
import { PropertyCards } from "./property-cards";
import { BulkBar } from "./bulk-bar";
import { BulkActionDialog } from "./bulk-action-dialog";
import { SavedViews } from "./saved-views";
import { RegisterPackageModal } from "./register-package-modal";
import { sortProperties } from "./matrix-utils";
import type { ByPropertyIndex, DashboardData, Density, Lens, OwnerFilter, Property, SortConfig } from "./types";

type Toast = { message: string; type: "success" | "error" };

function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });
  const set = useCallback((v: T) => {
    setVal(v);
    localStorage.setItem(key, JSON.stringify(v));
  }, [key]);
  return [val, set];
}

export function PropertyMatrix() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // ── State ────────────────────────────────────────────────────────────────
  const [lens, setLensState] = useState<Lens>((params.get("lens") as Lens) ?? "overview");
  const [owner, setOwnerState] = useState<OwnerFilter>((params.get("owner") as OwnerFilter) ?? "all");
  const [query, setQueryState] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<SortConfig>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [peekId, setPeekId] = useState<string | null>(null);
  const [density, setDensity] = useLocalStorage<Density>("hub-matrix-density", "comfortable");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── URL sync helpers ─────────────────────────────────────────────────────
  function pushParams(updates: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v); else next.delete(k);
    });
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  function setLens(l: Lens) { setLensState(l); pushParams({ lens: l }); }
  function setOwner(o: OwnerFilter) { setOwnerState(o); pushParams({ owner: o === "all" ? "" : o }); }
  function setQuery(q: string) { setQueryState(q); pushParams({ q }); }

  function handleSort(key: string) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/fleet/dashboard")
      .then((r) => r.json())
      .then((body) => {
        if (body.error) setError(body.error);
        else { setData(body.data); setLastFetched(new Date()); }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Action handlers ──────────────────────────────────────────────────────
  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/deployments/sync", { method: "POST" });
      const json = await res.json();
      const summary = json.data?.summary;
      fetchData();
      if (summary) {
        setToast({
          message: `Synced ${summary.synced} of ${summary.total} properties${
            summary.unreachable > 0 ? ` · ${summary.unreachable} unreachable` : ""
          }`,
          type: summary.unreachable > 0 ? "error" : "success",
        });
      } else if (!res.ok) {
        setToast({ message: json.error ?? "Sync failed", type: "error" });
      }
    } catch {
      setToast({ message: "Sync failed — check network.", type: "error" });
    }
    setSyncing(false);
  }, [fetchData]);

  const handleTogglePin = useCallback(async (deploymentId: string, currentlyPinned: boolean) => {
    try {
      await fetch(`/api/deployments/${deploymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !currentlyPinned }),
      });
      fetchData();
      setToast({ message: currentlyPinned ? "Version unpinned" : "Version pinned", type: "success" });
    } catch {
      setToast({ message: "Failed to update pin", type: "error" });
    }
  }, [fetchData]);

  const handleUpgrade = useCallback(async (_deploymentId: string, propertyId: string) => {
    const ghToken = typeof window !== "undefined" ? localStorage.getItem("gh_token") : null;
    if (!ghToken) {
      setToast({ message: "GitHub token required — connect via /fleet/onboard first", type: "error" });
      return;
    }
    try {
      const res = await fetch("/api/fleet/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyIds: [propertyId], ghToken }),
      });
      const json = await res.json();
      const result = json.data?.results?.[0];
      if (result?.status === "upgraded") {
        fetchData();
        setToast({ message: "Upgrade PR created", type: "success" });
      } else {
        setToast({ message: result?.error ?? "Upgrade failed", type: "error" });
      }
    } catch {
      setToast({ message: "Upgrade failed", type: "error" });
    }
  }, [fetchData]);

  const handleUpdateProperty = useCallback(async (propertyId: string, updates: Record<string, unknown>) => {
    try {
      await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      fetchData();
      setToast({ message: "Property updated", type: "success" });
    } catch {
      setToast({ message: "Failed to update property", type: "error" });
    }
  }, [fetchData]);

  const handleAddMarketing = useCallback(async (propertyId: string, serviceType: string) => {
    try {
      await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          service_type: serviceType,
          status: "planned",
          provider: "internal",
        }),
      });
      fetchData();
      setToast({ message: `Added ${serviceType} service`, type: "success" });
    } catch {
      setToast({ message: "Failed to add service", type: "error" });
    }
  }, [fetchData]);

  const handleUpdateMarketing = useCallback(async (serviceId: string, updates: Record<string, string>) => {
    try {
      await fetch(`/api/marketing/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      fetchData();
    } catch {
      setToast({ message: "Failed to update service", type: "error" });
    }
  }, [fetchData]);

  const handleDeleteMarketing = useCallback(async (serviceId: string) => {
    try {
      await fetch(`/api/marketing/${serviceId}`, { method: "DELETE" });
      fetchData();
      setToast({ message: "Service removed", type: "success" });
    } catch {
      setToast({ message: "Failed to remove service", type: "error" });
    }
  }, [fetchData]);

  const handleRegisterPackage = useCallback(
    async (propertyId: string, packageName: string, version: string, category: string) => {
      try {
        await fetch("/api/deployments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property_id: propertyId,
            package_name: packageName,
            package_category: category,
            installed_version: version,
            status: "active",
          }),
        });
        fetchData();
        setRegisterOpen(false);
        setToast({ message: `Registered ${packageName} v${version}`, type: "success" });
      } catch {
        setToast({ message: "Failed to register package", type: "error" });
      }
    },
    [fetchData],
  );

  const rowHandlers = useMemo<RowHandlers>(() => ({
    onTogglePin: handleTogglePin,
    onUpgrade: handleUpgrade,
    onAddMarketing: handleAddMarketing,
    onUpdateMarketing: handleUpdateMarketing,
    onDeleteMarketing: handleDeleteMarketing,
    onUpdateProperty: handleUpdateProperty,
  }), [handleTogglePin, handleUpgrade, handleAddMarketing, handleUpdateMarketing, handleDeleteMarketing, handleUpdateProperty]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const byProperty = useMemo<ByPropertyIndex | null>(() => {
    if (!data) return null;
    const deployMap = new Map<string, DashboardData["packageDeployments"][0][]>();
    for (const d of data.packageDeployments) {
      const list = deployMap.get(d.property_id) ?? [];
      list.push(d);
      deployMap.set(d.property_id, list);
    }
    const skillMap = new Map<string, DashboardData["skillCounts"][0]>();
    for (const s of data.skillCounts) skillMap.set(s.property_id, s);
    const mktMap = new Map<string, DashboardData["marketingServices"][0][]>();
    for (const m of data.marketingServices) {
      const list = mktMap.get(m.property_id) ?? [];
      list.push(m);
      mktMap.set(m.property_id, list);
    }
    return { deployMap, skillMap, mktMap };
  }, [data]);

  const attention = useMemo(() => {
    if (!data || !byProperty) return { down: 0, outdated: 0, failed: 0, planned: 0 };
    return {
      down: data.properties.filter((p) => p.health_status === "down" || p.health_status === "degraded").length,
      outdated: data.packageDeployments.filter((d) => d.installed_version && d.latest_version && d.installed_version !== d.latest_version).length,
      failed: data.skillCounts.reduce((n, s) => n + s.failed, 0),
      planned: data.marketingServices.filter((m) => m.status === "planned").length,
    };
  }, [data, byProperty]);

  const filteredProperties = useMemo(() => {
    if (!data || !byProperty) return [];
    let props = data.properties;
    if (owner !== "all") props = props.filter((p) => p.ownership_type === owner);
    if (query.trim()) {
      const q = query.toLowerCase();
      props = props.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
    }
    return sortProperties(props, sort, lens, byProperty.deployMap, byProperty.skillMap);
  }, [data, byProperty, owner, query, sort, lens]);

  const peekProperty = useMemo<Property | null>(
    () => (peekId && data ? (data.properties.find((p) => p.id === peekId) ?? null) : null),
    [peekId, data],
  );

  // ── Selection helpers ────────────────────────────────────────────────────
  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === filteredProperties.length
        ? new Set()
        : new Set(filteredProperties.map((p) => p.id)),
    );
  }

  // ── Error / loading states ───────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
        <p className="font-medium">Failed to load dashboard data</p>
        <p className="mt-1 text-xs text-red-400">{error}</p>
        <button onClick={fetchData} className="mt-3 rounded bg-red-500/20 px-3 py-1.5 text-xs hover:bg-red-500/30">
          Retry
        </button>
      </div>
    );
  }

  if (loading && !data) {
    return <MatrixSkeleton />;
  }

  return (
    <div className="space-y-5">
      {/* a11y live region for selection count */}
      <div aria-live="polite" aria-atomic className="sr-only">
        {selected.size > 0 ? `${selected.size} properties selected` : ""}
      </div>

      <AttentionStrip {...attention} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SavedViews
          currentLens={lens}
          currentOwner={owner}
          currentQuery={query}
          onApply={(v) => { setLens(v.lens); setOwner(v.owner); setQuery(v.query); }}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRegisterOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Register Package
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <MatrixFilters
          lens={lens} onLensChange={setLens}
          owner={owner} onOwnerChange={setOwner}
          query={query} onQueryChange={setQuery}
          density={density} onDensityChange={setDensity}
          total={data?.properties.length ?? 0}
          filtered={filteredProperties.length}
        />
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {lastFetched && <span>Updated {formatTime(lastFetched)}</span>}
          <button
            onClick={fetchData}
            disabled={loading}
            className="rounded p-1 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"
            title="Refresh data"
            aria-label="Refresh fleet data"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden />
          </button>
        </div>
      </div>

      {/* Mobile card view (< md) / desktop table view (>= md) */}
      <div className="md:hidden">
        <PropertyCards
          properties={filteredProperties}
          selected={selected}
          onToggle={toggleRow}
          onPeek={setPeekId}
          lens={lens}
          index={byProperty!}
        />
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid" aria-label="Fleet properties">
            <thead className="bg-zinc-950/60">
              <tr>
                <th className="w-10 px-3 py-2.5" scope="col">
                  <input
                    type="checkbox"
                    checked={filteredProperties.length > 0 && selected.size === filteredProperties.length}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-800 accent-violet-500"
                    aria-label={selected.size === filteredProperties.length ? "Deselect all" : "Select all"}
                  />
                </th>
                <SortableTh label="Property" sortKey="name" currentSort={sort} onSort={handleSort} />
                <LensHeaders lens={lens} sort={sort} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredProperties.map((p) => (
                <PropertyRow
                  key={p.id}
                  property={p}
                  selected={selected.has(p.id)}
                  onToggle={() => toggleRow(p.id)}
                  onPeek={() => setPeekId(p.id)}
                  lens={lens}
                  index={byProperty!}
                  density={density}
                  handlers={rowHandlers}
                />
              ))}
              {filteredProperties.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <p className="text-sm text-zinc-500">No properties match this filter.</p>
                    {(query || owner !== "all") && (
                      <button
                        onClick={() => { setQuery(""); setOwner("all"); }}
                        className="mt-2 text-xs text-violet-400 hover:text-violet-300"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {byProperty && (
        <PropertyPeek
          property={peekProperty}
          index={byProperty}
          onClose={() => setPeekId(null)}
        />
      )}

      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          selectedIds={Array.from(selected)}
          onClear={() => setSelected(new Set())}
          onDeploySkill={() => setDialogOpen(true)}
        />
      )}

      <BulkActionDialog
        open={dialogOpen}
        selectedIds={Array.from(selected)}
        onClose={() => setDialogOpen(false)}
      />

      {registerOpen && data && (
        <RegisterPackageModal
          properties={data.properties}
          onSubmit={handleRegisterPackage}
          onClose={() => setRegisterOpen(false)}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-4 top-20 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toast.type === "success"
              ? "border-emerald-500/20 bg-emerald-950 text-emerald-300"
              : "border-red-500/20 bg-red-950 text-red-300"
          }`}
        >
          {toast.type === "success" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100" aria-label="Dismiss">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function LensHeaders({ lens, sort, onSort }: { lens: Lens; sort: SortConfig; onSort: (k: string) => void }) {
  const th = (label: string, key: string) => (
    <SortableTh key={key} label={label} sortKey={key} currentSort={sort} onSort={onSort} />
  );
  if (lens === "overview") return <>{[th("Health", "health"), th("Modules", "modules"), th("Last deploy", "deploy"), th("URL", "url")]}</>;
  if (lens === "developer") return <>{[th("Version", "version"), th("Update", "upgrade"), th("Skills", "skills"), th("Modules", "modules")]}</>;
  if (lens === "marketing") return <>{[th("Active services", "mkt_active"), th("Planned", "mkt_planned"), th("Stage", "stage"), th("Domains", "domains")]}</>;
  return <>{[th("Ownership", "owner"), th("Stage", "stage"), th("LLC", "llc"), th("Category", "category")]}</>;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MatrixSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />
        ))}
      </div>
      <div className="h-10 w-64 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`flex items-center gap-3 px-3 py-3 ${i > 0 ? "border-t border-zinc-800/60" : ""}`}>
            <div className="h-3.5 w-3.5 rounded bg-zinc-800" />
            <div className="h-2 w-2 rounded-full bg-zinc-800" />
            <div className="h-4 w-32 rounded bg-zinc-800" />
            <div className="ml-auto h-4 w-16 rounded bg-zinc-800" />
            <div className="h-4 w-20 rounded bg-zinc-800" />
            <div className="h-4 w-12 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
