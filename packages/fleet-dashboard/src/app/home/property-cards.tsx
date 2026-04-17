"use client";

import Link from "next/link";
import { ExternalLink, RefreshCcw } from "lucide-react";
import type { ByPropertyIndex, Density, Lens, Property } from "./types";
import { cmsDeploy, healthMeta, needsUpgrade, ownershipClass, relativeTime, stageClass } from "./matrix-utils";

interface Props {
  properties: Property[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onPeek: (id: string) => void;
  lens: Lens;
  index: ByPropertyIndex;
}

export function PropertyCards({ properties, selected, onToggle, onPeek, lens, index }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="list" aria-label="Properties">
      {properties.map((p) => (
        <PropertyCard
          key={p.id}
          property={p}
          selected={selected.has(p.id)}
          onToggle={() => onToggle(p.id)}
          onPeek={() => onPeek(p.id)}
          lens={lens}
          index={index}
        />
      ))}
      {properties.length === 0 && (
        <p className="col-span-2 py-12 text-center text-sm text-zinc-500">No properties match this filter.</p>
      )}
    </div>
  );
}

function PropertyCard({ property, selected, onToggle, onPeek, lens, index }: {
  property: Property;
  selected: boolean;
  onToggle: () => void;
  onPeek: () => void;
  lens: Lens;
  index: ByPropertyIndex;
}) {
  const health = healthMeta(property.health_status);
  const deployments = index.deployMap.get(property.id) ?? [];
  const skills = index.skillMap.get(property.id);
  const marketing = index.mktMap.get(property.id) ?? [];
  const cms = cmsDeploy(deployments);
  const upgrade = needsUpgrade(cms);

  return (
    <div
      role="listitem"
      className={`rounded-lg border p-4 transition-colors ${
        selected ? "border-violet-500/40 bg-violet-500/5" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-0.5 h-3.5 w-3.5 accent-violet-500"
          aria-label={`Select ${property.name}`}
        />
        <button onClick={onPeek} className="flex flex-1 items-start gap-2 text-left">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${health.dot}`} title={health.label} />
          <div className="min-w-0">
            <p className="truncate font-medium text-white hover:text-violet-300">{property.name}</p>
            <p className="truncate text-xs text-zinc-500">{property.slug}</p>
          </div>
        </button>
        {property.url && (
          <a href={property.url} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 text-zinc-500 hover:text-zinc-300"
            aria-label={`Visit ${property.name}`}>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Lens-specific details */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {lens === "ops" && (
          <>
            <Detail label="Health" value={health.label} valueClass={health.text} />
            <Detail label="Modules" value={String(property.enabled_modules.length)} />
            <Detail label="Last deploy" value={relativeTime(property.last_deploy_at)} />
            <Detail label="Status" value={property.status} />
          </>
        )}
        {lens === "developer" && (
          <>
            <Detail label="CMS" value={cms?.installed_version ?? "—"} valueClass="font-mono" />
            <Detail label="Update" value={upgrade ? `→ ${cms?.latest_version}` : "current"} valueClass={upgrade ? "text-amber-400" : "text-emerald-400"} />
            <Detail label="Skills" value={skills ? `${skills.active}a ${skills.failed > 0 ? skills.failed + "!" : ""}` : "—"} />
            <Detail label="Modules" value={String(property.enabled_modules.length)} />
          </>
        )}
        {lens === "marketing" && (
          <>
            <Detail label="Active" value={String(marketing.filter((m) => m.status === "active").length)} />
            <Detail label="Planned" value={String(marketing.filter((m) => m.status === "planned").length)} />
            <Detail label="Stage" value={property.business_stage} valueClass={stageClass(property.business_stage)} />
            <Detail label="Domains" value={String(property.domains.length || "—")} />
          </>
        )}
        {lens === "business" && (
          <>
            <Detail label="Type" value={property.ownership_type} />
            {property.client_name && <Detail label="Client" value={property.client_name} />}
            <Detail label="Stage" value={property.business_stage} valueClass={stageClass(property.business_stage)} />
            <Detail label="LLC" value={property.llc_entity ?? "—"} />
          </>
        )}
      </div>

      {/* Ownership badge */}
      <div className="mt-3">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${ownershipClass(property.ownership_type)}`}>
          {property.ownership_type}
        </span>
      </div>
    </div>
  );
}

function Detail({ label, value, valueClass = "text-zinc-300" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <p className="text-[10px] text-zinc-600">{label}</p>
      <p className={`truncate text-xs font-medium ${valueClass}`}>{value}</p>
    </div>
  );
}
