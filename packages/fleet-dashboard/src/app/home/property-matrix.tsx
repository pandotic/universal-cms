"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  ExternalLink,
  Filter,
  Play,
  RefreshCcw,
  Rocket,
  XCircle,
  type LucideIcon,
} from "lucide-react";

type Lens = "ops" | "developer" | "marketing" | "business";

type Property = {
  id: string;
  name: string;
  slug: string;
  url: string;
  status: string;
  health_status: "healthy" | "degraded" | "down" | "unknown";
  ownership_type: "personal" | "pandotic" | "client";
  client_name: string | null;
  business_stage: "idea" | "development" | "active" | "maintenance" | "sunset";
  business_category: string | null;
  enabled_modules: string[];
  domains: string[];
  llc_entity: string | null;
  last_deploy_at: string | null;
  cms_installed: boolean;
  onboarding_status: string;
};

type Deployment = {
  property_id: string;
  package_name: string;
  installed_version: string | null;
  latest_version: string | null;
  pinned: boolean;
  status: string;
  enabled_modules: string[];
};

type SkillCount = {
  property_id: string;
  active: number;
  outdated: number;
  failed: number;
};

type MarketingService = {
  property_id: string;
  service_type: string;
  status: string;
};

type DashboardData = {
  properties: Property[];
  packageDeployments: Deployment[];
  skillCounts: SkillCount[];
  marketingServices: MarketingService[];
};

const LENSES: { id: Lens; label: string; hint: string }[] = [
  { id: "ops", label: "Operations", hint: "Health · deploys · errors" },
  { id: "developer", label: "Developer", hint: "Versions · skills · modules" },
  { id: "marketing", label: "Marketing", hint: "Services · content · brand" },
  { id: "business", label: "Business", hint: "Stage · ownership · LLC" },
];

function healthDot(status: Property["health_status"]) {
  const map = {
    healthy: { color: "bg-emerald-400", Icon: CheckCircle2, label: "Healthy" },
    degraded: { color: "bg-amber-400", Icon: AlertTriangle, label: "Degraded" },
    down: { color: "bg-red-500", Icon: XCircle, label: "Down" },
    unknown: { color: "bg-zinc-600", Icon: CircleSlash, label: "Unknown" },
  } as const;
  return map[status] ?? map.unknown;
}

function ownershipBadge(o: Property["ownership_type"]) {
  const map = {
    personal: "bg-violet-500/10 text-violet-300 ring-violet-500/30",
    pandotic: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/30",
    client: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
  } as const;
  return map[o];
}

export function PropertyMatrix() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lens, setLens] = useState<Lens>("ops");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [ownerFilter, setOwnerFilter] = useState<"all" | Property["ownership_type"]>("all");

  useEffect(() => {
    fetch("/api/fleet/dashboard")
      .then((r) => r.json())
      .then((body) => {
        if (body.error) setError(body.error);
        else setData(body.data);
      })
      .catch((e) => setError(e.message));
  }, []);

  const byProperty = useMemo(() => {
    if (!data) return null;
    const deployMap = new Map<string, Deployment[]>();
    for (const d of data.packageDeployments) {
      const list = deployMap.get(d.property_id) ?? [];
      list.push(d);
      deployMap.set(d.property_id, list);
    }
    const skillMap = new Map<string, SkillCount>();
    for (const s of data.skillCounts) skillMap.set(s.property_id, s);
    const mktMap = new Map<string, MarketingService[]>();
    for (const m of data.marketingServices) {
      const list = mktMap.get(m.property_id) ?? [];
      list.push(m);
      mktMap.set(m.property_id, list);
    }
    return { deployMap, skillMap, mktMap };
  }, [data]);

  const filteredProperties = useMemo(() => {
    if (!data) return [];
    if (ownerFilter === "all") return data.properties;
    return data.properties.filter((p) => p.ownership_type === ownerFilter);
  }, [data, ownerFilter]);

  const attention = useMemo(() => {
    if (!data || !byProperty) return { down: 0, outdated: 0, failed: 0, planned: 0 };
    const down = data.properties.filter((p) => p.health_status === "down" || p.health_status === "degraded").length;
    const outdated = data.packageDeployments.filter(
      (d) => d.installed_version && d.latest_version && d.installed_version !== d.latest_version,
    ).length;
    const failed = data.skillCounts.reduce((n, s) => n + s.failed, 0);
    const planned = data.marketingServices.filter((m) => m.status === "planned").length;
    return { down, outdated, failed, planned };
  }, [data, byProperty]);

  function toggleRow(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === filteredProperties.length) setSelected(new Set());
    else setSelected(new Set(filteredProperties.map((p) => p.id)));
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
        Failed to load dashboard: {error}
      </div>
    );
  }

  if (!data || !byProperty) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />
        <div className="h-96 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AttentionStrip {...attention} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <LensTabs lens={lens} onChange={setLens} />
        <OwnerFilter value={ownerFilter} onChange={setOwnerFilter} />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/80 text-left text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={
                      filteredProperties.length > 0 &&
                      selected.size === filteredProperties.length
                    }
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-800"
                  />
                </th>
                <th className="px-3 py-2.5 font-medium">Property</th>
                <LensHeaders lens={lens} />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredProperties.map((p) => (
                <PropertyRow
                  key={p.id}
                  property={p}
                  selected={selected.has(p.id)}
                  onToggle={() => toggleRow(p.id)}
                  lens={lens}
                  deployments={byProperty.deployMap.get(p.id) ?? []}
                  skills={byProperty.skillMap.get(p.id)}
                  marketing={byProperty.mktMap.get(p.id) ?? []}
                />
              ))}
              {filteredProperties.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-zinc-500">
                    No properties match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          selectedIds={Array.from(selected)}
          onClear={() => setSelected(new Set())}
        />
      )}
    </div>
  );
}

function AttentionStrip({
  down,
  outdated,
  failed,
  planned,
}: {
  down: number;
  outdated: number;
  failed: number;
  planned: number;
}) {
  const items: { label: string; count: number; tone: string; href: string; Icon: LucideIcon }[] = [
    {
      label: "Sites with health issues",
      count: down,
      tone: "text-red-300 ring-red-500/30 bg-red-500/10",
      href: "/fleet",
      Icon: XCircle,
    },
    {
      label: "Packages out of date",
      count: outdated,
      tone: "text-amber-300 ring-amber-500/30 bg-amber-500/10",
      href: "/fleet",
      Icon: RefreshCcw,
    },
    {
      label: "Failed skill deployments",
      count: failed,
      tone: "text-rose-300 ring-rose-500/30 bg-rose-500/10",
      href: "/skills/matrix",
      Icon: AlertTriangle,
    },
    {
      label: "Marketing tasks planned",
      count: planned,
      tone: "text-cyan-300 ring-cyan-500/30 bg-cyan-500/10",
      href: "/fleet",
      Icon: Play,
    },
  ];

  const nothing = items.every((i) => i.count === 0);
  if (nothing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
        <CheckCircle2 className="h-4 w-4" />
        Nothing needs attention right now. Fleet looks clean.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((i) => (
        <Link
          key={i.label}
          href={i.href}
          className={`flex items-center justify-between rounded-lg px-4 py-3 ring-1 ring-inset transition-colors hover:bg-opacity-20 ${i.tone}`}
        >
          <div>
            <div className="text-2xl font-semibold">{i.count}</div>
            <div className="text-xs opacity-80">{i.label}</div>
          </div>
          <i.Icon className="h-5 w-5 opacity-70" />
        </Link>
      ))}
    </div>
  );
}

function LensTabs({ lens, onChange }: { lens: Lens; onChange: (l: Lens) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-1 text-sm">
      {LENSES.map((l) => (
        <button
          key={l.id}
          onClick={() => onChange(l.id)}
          className={`rounded-md px-3 py-1.5 transition-colors ${
            lens === l.id
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          title={l.hint}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function OwnerFilter({
  value,
  onChange,
}: {
  value: "all" | Property["ownership_type"];
  onChange: (v: "all" | Property["ownership_type"]) => void;
}) {
  const options: { id: typeof value; label: string }[] = [
    { id: "all", label: "All" },
    { id: "personal", label: "Personal" },
    { id: "pandotic", label: "Pandotic" },
    { id: "client", label: "Client" },
  ];
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500">
      <Filter className="h-3.5 w-3.5" />
      <div className="inline-flex rounded-md border border-zinc-800 bg-zinc-900 p-0.5">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`rounded px-2.5 py-1 transition-colors ${
              value === o.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LensHeaders({ lens }: { lens: Lens }) {
  if (lens === "ops") {
    return (
      <>
        <th className="px-3 py-2.5 font-medium">Health</th>
        <th className="px-3 py-2.5 font-medium">Modules</th>
        <th className="px-3 py-2.5 font-medium">Last deploy</th>
        <th className="px-3 py-2.5 font-medium">URL</th>
      </>
    );
  }
  if (lens === "developer") {
    return (
      <>
        <th className="px-3 py-2.5 font-medium">CMS version</th>
        <th className="px-3 py-2.5 font-medium">Update</th>
        <th className="px-3 py-2.5 font-medium">Skills</th>
        <th className="px-3 py-2.5 font-medium">Modules</th>
      </>
    );
  }
  if (lens === "marketing") {
    return (
      <>
        <th className="px-3 py-2.5 font-medium">Active services</th>
        <th className="px-3 py-2.5 font-medium">Planned</th>
        <th className="px-3 py-2.5 font-medium">Stage</th>
        <th className="px-3 py-2.5 font-medium">Domains</th>
      </>
    );
  }
  return (
    <>
      <th className="px-3 py-2.5 font-medium">Ownership</th>
      <th className="px-3 py-2.5 font-medium">Stage</th>
      <th className="px-3 py-2.5 font-medium">LLC</th>
      <th className="px-3 py-2.5 font-medium">Category</th>
    </>
  );
}

function PropertyRow({
  property,
  selected,
  onToggle,
  lens,
  deployments,
  skills,
  marketing,
}: {
  property: Property;
  selected: boolean;
  onToggle: () => void;
  lens: Lens;
  deployments: Deployment[];
  skills: SkillCount | undefined;
  marketing: MarketingService[];
}) {
  const health = healthDot(property.health_status);
  const cms = deployments.find((d) => d.package_name.includes("universal-cms"));
  const needsUpgrade =
    cms?.installed_version && cms?.latest_version && cms.installed_version !== cms.latest_version;

  return (
    <tr className={`transition-colors ${selected ? "bg-zinc-800/40" : "hover:bg-zinc-900/60"}`}>
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-800"
        />
      </td>
      <td className="px-3 py-3">
        <Link
          href={`/properties/${property.slug}`}
          className="group flex items-center gap-2"
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${health.color}`}
            title={health.label}
          />
          <div className="min-w-0">
            <div className="truncate font-medium text-white group-hover:text-violet-300">
              {property.name}
            </div>
            <div className="truncate text-xs text-zinc-500">{property.slug}</div>
          </div>
        </Link>
      </td>

      {lens === "ops" && (
        <>
          <td className="px-3 py-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300">
              <health.Icon className="h-3.5 w-3.5" />
              {health.label}
            </span>
          </td>
          <td className="px-3 py-3 text-xs text-zinc-400">
            {property.enabled_modules.length}
          </td>
          <td className="px-3 py-3 text-xs text-zinc-500">
            {property.last_deploy_at
              ? new Date(property.last_deploy_at).toLocaleDateString()
              : "—"}
          </td>
          <td className="px-3 py-3">
            {property.url ? (
              <a
                href={property.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
              >
                Visit <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-xs text-zinc-600">—</span>
            )}
          </td>
        </>
      )}

      {lens === "developer" && (
        <>
          <td className="px-3 py-3 font-mono text-xs text-zinc-300">
            {cms?.installed_version ?? <span className="text-zinc-600">not installed</span>}
          </td>
          <td className="px-3 py-3">
            {needsUpgrade ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300 ring-1 ring-inset ring-amber-500/30">
                <RefreshCcw className="h-3 w-3" /> → {cms?.latest_version}
              </span>
            ) : cms ? (
              <span className="text-xs text-emerald-400">current</span>
            ) : (
              <span className="text-xs text-zinc-600">—</span>
            )}
          </td>
          <td className="px-3 py-3">
            <SkillChips skills={skills} />
          </td>
          <td className="px-3 py-3 text-xs text-zinc-400">
            {property.enabled_modules.length}
          </td>
        </>
      )}

      {lens === "marketing" && (
        <>
          <td className="px-3 py-3 text-xs text-zinc-300">
            {marketing.filter((m) => m.status === "active").length}
          </td>
          <td className="px-3 py-3 text-xs text-cyan-300">
            {marketing.filter((m) => m.status === "planned").length || (
              <span className="text-zinc-600">0</span>
            )}
          </td>
          <td className="px-3 py-3 text-xs text-zinc-400">
            {property.business_stage}
          </td>
          <td className="px-3 py-3 text-xs text-zinc-400">
            {property.domains.length || "—"}
          </td>
        </>
      )}

      {lens === "business" && (
        <>
          <td className="px-3 py-3">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${ownershipBadge(property.ownership_type)}`}
            >
              {property.ownership_type}
              {property.client_name ? ` · ${property.client_name}` : ""}
            </span>
          </td>
          <td className="px-3 py-3 text-xs text-zinc-400">{property.business_stage}</td>
          <td className="px-3 py-3 text-xs text-zinc-400">{property.llc_entity ?? "—"}</td>
          <td className="px-3 py-3 text-xs text-zinc-400">
            {property.business_category ?? "—"}
          </td>
        </>
      )}
    </tr>
  );
}

function SkillChips({ skills }: { skills: SkillCount | undefined }) {
  if (!skills) return <span className="text-xs text-zinc-600">—</span>;
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      {skills.active > 0 && (
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
          {skills.active} active
        </span>
      )}
      {skills.outdated > 0 && (
        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-300 ring-1 ring-inset ring-amber-500/30">
          {skills.outdated} old
        </span>
      )}
      {skills.failed > 0 && (
        <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-300 ring-1 ring-inset ring-red-500/30">
          {skills.failed} failed
        </span>
      )}
      {skills.active + skills.outdated + skills.failed === 0 && (
        <span className="text-zinc-600">—</span>
      )}
    </div>
  );
}

function BulkActionBar({
  count,
  selectedIds,
  onClear,
}: {
  count: number;
  selectedIds: string[];
  onClear: () => void;
}) {
  const idsParam = encodeURIComponent(selectedIds.join(","));
  return (
    <div className="sticky bottom-4 z-30 mx-auto flex max-w-3xl items-center gap-3 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 shadow-2xl shadow-black/40">
      <span className="text-sm text-zinc-300">
        <span className="font-semibold text-white">{count}</span> selected
      </span>
      <span className="h-4 w-px bg-zinc-700" />
      <Link
        href={`/skills/deploy?properties=${idsParam}`}
        className="inline-flex items-center gap-1.5 rounded-full bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-400"
      >
        <Rocket className="h-3.5 w-3.5" />
        Deploy skill to {count}
      </Link>
      <Link
        href={`/fleet/deploy?properties=${idsParam}`}
        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
      >
        <RefreshCcw className="h-3.5 w-3.5" />
        Upgrade CMS
      </Link>
      <Link
        href={`/agents?properties=${idsParam}`}
        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
      >
        <Play className="h-3.5 w-3.5" />
        Run agent
      </Link>
      <button
        onClick={onClear}
        className="ml-auto text-xs text-zinc-500 hover:text-zinc-200"
      >
        Clear
      </button>
    </div>
  );
}
