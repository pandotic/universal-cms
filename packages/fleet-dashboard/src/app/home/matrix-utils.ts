import type { Property, Deployment, SkillCount, Lens, SortConfig } from "./types";

export function healthMeta(status: Property["health_status"]) {
  return {
    healthy: { dot: "bg-emerald-400", text: "text-emerald-400", label: "Healthy" },
    degraded: { dot: "bg-amber-400", text: "text-amber-400", label: "Degraded" },
    down: { dot: "bg-red-500", text: "text-red-400", label: "Down" },
    unknown: { dot: "bg-zinc-600", text: "text-zinc-500", label: "Unknown" },
  }[status];
}

export function ownershipClass(o: Property["ownership_type"]) {
  return {
    personal: "bg-violet-500/10 text-violet-300 ring-violet-500/30",
    pandotic: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/30",
    client: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
  }[o];
}

export function stageClass(s: Property["business_stage"]) {
  return {
    idea: "text-zinc-500",
    development: "text-blue-400",
    active: "text-emerald-400",
    maintenance: "text-amber-400",
    sunset: "text-red-400",
  }[s] ?? "text-zinc-400";
}

export function cmsDeploy(deployments: Deployment[]) {
  return deployments.find((d) => d.package_name.includes("universal-cms"));
}

export function needsUpgrade(cms: Deployment | undefined) {
  return !!(
    cms?.installed_version &&
    cms?.latest_version &&
    cms.installed_version !== cms.latest_version
  );
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function sortProperties(
  props: Property[],
  sort: SortConfig,
  lens: Lens,
  deployMap: Map<string, Deployment[]>,
  skillMap: Map<string, SkillCount>,
): Property[] {
  if (!sort) return props;
  const dir = sort.dir === "asc" ? 1 : -1;

  return [...props].sort((a, b) => {
    const get = (p: Property): string | number => {
      if (sort.key === "name") return p.name.toLowerCase();
      if (sort.key === "health") {
        const order = { healthy: 0, degraded: 1, down: 2, unknown: 3 };
        return order[p.health_status] ?? 3;
      }
      if (sort.key === "modules") return p.enabled_modules.length;
      if (sort.key === "deploy") return p.last_deploy_at ?? "";
      if (sort.key === "version") {
        const cms = cmsDeploy(deployMap.get(p.id) ?? []);
        return cms?.installed_version ?? "";
      }
      if (sort.key === "skills") return skillMap.get(p.id)?.active ?? 0;
      if (sort.key === "stage") {
        const order: Record<string, number> = { idea: 0, development: 1, active: 2, maintenance: 3, sunset: 4 };
        return order[p.business_stage] ?? 0;
      }
      if (sort.key === "owner") return p.ownership_type;
      return p.name.toLowerCase();
    };
    const av = get(a);
    const bv = get(b);
    return av < bv ? -dir : av > bv ? dir : 0;
  });
}
