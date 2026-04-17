import Link from "next/link";
import { CheckCircle2, ExternalLink, RefreshCcw } from "lucide-react";
import type { ByPropertyIndex, Density, Lens, Property } from "./types";
import { cmsDeploy, healthMeta, needsUpgrade, ownershipClass, relativeTime, stageClass } from "./matrix-utils";

interface RowProps {
  property: Property;
  selected: boolean;
  onToggle: () => void;
  onPeek: () => void;
  lens: Lens;
  index: ByPropertyIndex;
  density: Density;
}

export function PropertyRow({ property, selected, onToggle, onPeek, lens, index, density }: RowProps) {
  const health = healthMeta(property.health_status);
  const deployments = index.deployMap.get(property.id) ?? [];
  const skills = index.skillMap.get(property.id);
  const marketing = index.mktMap.get(property.id) ?? [];
  const cms = cmsDeploy(deployments);
  const upgrade = needsUpgrade(cms);
  const py = density === "compact" ? "py-2" : "py-3";

  return (
    <tr
      className={`group transition-colors ${selected ? "bg-zinc-800/40" : "hover:bg-zinc-900/60"}`}
    >
      <td className={`px-3 ${py}`}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-800 accent-violet-500"
          aria-label={`Select ${property.name}`}
        />
      </td>

      {/* Property name — always visible */}
      <td className={`px-3 ${py}`}>
        <button onClick={onPeek} className="group/name flex items-center gap-2 text-left w-full">
          <span className={`h-2 w-2 shrink-0 rounded-full ${health.dot}`} title={health.label} />
          <div className="min-w-0">
            <div className="truncate font-medium text-white group-hover/name:text-violet-300 max-w-[160px]">
              {property.name}
            </div>
            <div className="truncate text-xs text-zinc-500 max-w-[160px]">{property.slug}</div>
          </div>
        </button>
      </td>

      {lens === "ops" && <OpsColumns property={property} health={health} py={py} />}
      {lens === "developer" && <DevColumns property={property} cms={cms} upgrade={upgrade} skills={skills} py={py} />}
      {lens === "marketing" && <MktColumns property={property} marketing={marketing} py={py} />}
      {lens === "business" && <BizColumns property={property} py={py} />}
    </tr>
  );
}

function OpsColumns({ property, health, py }: { property: Property; health: ReturnType<typeof healthMeta>; py: string }) {
  return (
    <>
      <td className={`px-3 ${py}`}>
        <span className={`inline-flex items-center gap-1 text-xs ${health.text}`}>
          {health.label}
        </span>
      </td>
      <td className={`px-3 ${py} text-xs text-zinc-400 tabular-nums`}>
        {property.enabled_modules.length}
      </td>
      <td className={`px-3 ${py} text-xs text-zinc-500`}>
        {relativeTime(property.last_deploy_at)}
      </td>
      <td className={`px-3 ${py}`}>
        {property.url ? (
          <a
            href={property.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
          >
            Visit <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs text-zinc-700">—</span>
        )}
      </td>
    </>
  );
}

function DevColumns({ property, cms, upgrade, skills, py }: {
  property: Property;
  cms: ReturnType<typeof cmsDeploy>;
  upgrade: boolean;
  skills: ByPropertyIndex["skillMap"] extends Map<string, infer V> ? V | undefined : never;
  py: string;
}) {
  return (
    <>
      <td className={`px-3 ${py} font-mono text-xs text-zinc-300`}>
        {cms?.installed_version ?? <span className="text-zinc-600">—</span>}
      </td>
      <td className={`px-3 ${py}`}>
        {upgrade ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300 ring-1 ring-inset ring-amber-500/30">
            <RefreshCcw className="h-3 w-3" /> {cms?.latest_version}
          </span>
        ) : cms ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <span className="text-xs text-zinc-600">—</span>
        )}
      </td>
      <td className={`px-3 ${py}`}>
        {skills ? (
          <div className="flex items-center gap-1 text-[11px]">
            {skills.active > 0 && <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-300 ring-1 ring-inset ring-emerald-500/30">{skills.active}</span>}
            {skills.outdated > 0 && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-300 ring-1 ring-inset ring-amber-500/30">{skills.outdated}↑</span>}
            {skills.failed > 0 && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-300 ring-1 ring-inset ring-red-500/30">{skills.failed}!</span>}
          </div>
        ) : <span className="text-xs text-zinc-600">—</span>}
      </td>
      <td className={`px-3 ${py} text-xs text-zinc-400 tabular-nums`}>
        {property.enabled_modules.length}
      </td>
    </>
  );
}

function MktColumns({ property, marketing, py }: { property: Property; marketing: { service_type: string; status: string }[]; py: string }) {
  const active = marketing.filter((m) => m.status === "active").length;
  const planned = marketing.filter((m) => m.status === "planned").length;
  return (
    <>
      <td className={`px-3 ${py} text-xs tabular-nums ${active > 0 ? "text-emerald-400" : "text-zinc-600"}`}>{active || "—"}</td>
      <td className={`px-3 ${py} text-xs tabular-nums ${planned > 0 ? "text-cyan-400" : "text-zinc-600"}`}>{planned || "—"}</td>
      <td className={`px-3 ${py} text-xs ${stageClass(property.business_stage)}`}>{property.business_stage}</td>
      <td className={`px-3 ${py} text-xs text-zinc-400 tabular-nums`}>{property.domains.length || "—"}</td>
    </>
  );
}

function BizColumns({ property, py }: { property: Property; py: string }) {
  return (
    <>
      <td className={`px-3 ${py}`}>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${ownershipClass(property.ownership_type)}`}>
          {property.ownership_type}{property.client_name ? ` · ${property.client_name}` : ""}
        </span>
      </td>
      <td className={`px-3 ${py} text-xs ${stageClass(property.business_stage)}`}>{property.business_stage}</td>
      <td className={`px-3 ${py} text-xs text-zinc-400`}>{property.llc_entity ?? "—"}</td>
      <td className={`px-3 ${py} text-xs text-zinc-400`}>{property.business_category ?? "—"}</td>
    </>
  );
}

// ─── Sortable column header ──────────────────────────────────────────────────

interface ThProps {
  label: string;
  sortKey: string;
  currentSort: { key: string; dir: "asc" | "desc" } | null;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableTh({ label, sortKey, currentSort, onSort, className = "" }: ThProps) {
  const active = currentSort?.key === sortKey;
  return (
    <th
      className={`cursor-pointer select-none px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
        active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
      } ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="text-[10px]">
          {active ? (currentSort?.dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </span>
    </th>
  );
}
