"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  RefreshCw,
  Package,
  Zap,
  Megaphone,
  Briefcase,
  ExternalLink,
  Pin,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

interface Property {
  id: string;
  name: string;
  slug: string;
  url: string;
  property_type: string;
  status: string;
  health_status: string;
  enabled_modules: string[];
  business_category: string | null;
  ownership_type: string;
  client_name: string | null;
  business_stage: string;
  domains: string[];
  domain_notes: string | null;
  llc_entity: string | null;
  business_notes: string | null;
}

interface PackageDeployment {
  id: string;
  property_id: string;
  package_name: string;
  package_category: string;
  installed_version: string | null;
  latest_version: string | null;
  pinned: boolean;
  enabled_modules: string[];
  bespoke_modules: string[];
  status: string;
  last_health_check_at: string | null;
  github_repo: string | null;
}

interface MarketingService {
  id: string;
  property_id: string;
  service_type: string;
  status: string;
  provider: string;
  notes: string | null;
}

interface SkillCount {
  property_id: string;
  active: number;
  outdated: number;
  failed: number;
  lastRun: string | null;
}

interface DashboardData {
  properties: Property[];
  packageDeployments: PackageDeployment[];
  marketingServices: MarketingService[];
  skillCounts: SkillCount[];
}

type TabId = "deployments" | "skills" | "marketing" | "business";

const TABS: { id: TabId; label: string; icon: typeof Package }[] = [
  { id: "deployments", label: "Deployments", icon: Package },
  { id: "skills", label: "Skills", icon: Zap },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "business", label: "Business", icon: Briefcase },
];

const SERVICE_LABELS: Record<string, string> = {
  seo: "SEO",
  content: "Content",
  social: "Social",
  paid_ads: "Paid Ads",
  email: "Email",
  analytics: "Analytics",
  branding: "Branding",
  pr: "PR",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  planned: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  paused: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  completed: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
};

const STAGE_COLORS: Record<string, string> = {
  idea: "text-purple-400",
  development: "text-blue-400",
  active: "text-emerald-400",
  maintenance: "text-amber-400",
  sunset: "text-zinc-500",
};

const OWNERSHIP_LABELS: Record<string, string> = {
  personal: "Personal",
  pandotic: "Pandotic",
  client: "Client",
};

// ─── Page ─────────────────────────────────────────────────────────────────

export default function FleetDashboardPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabId) || "deployments";

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/fleet/dashboard");
      const json = await res.json();
      setData(json.data);
    } catch {
      // empty state
    }
    setLoading(false);
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/deployments/sync", { method: "POST" });
      await loadData();
    } catch {
      // ignore
    }
    setSyncing(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading fleet data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-medium text-red-400">
          Failed to load fleet data
        </p>
      </div>
    );
  }

  const filteredProperties =
    ownerFilter === "all"
      ? data.properties
      : data.properties.filter((p) => p.ownership_type === ownerFilter);

  function getDeployments(propertyId: string) {
    return data!.packageDeployments.filter((d) => d.property_id === propertyId);
  }

  function getCmsDeployment(propertyId: string) {
    return data!.packageDeployments.find(
      (d) =>
        d.property_id === propertyId &&
        d.package_name === "@pandotic/universal-cms"
    );
  }

  function getSkillCounts(propertyId: string) {
    return (
      data!.skillCounts.find((s) => s.property_id === propertyId) ?? {
        active: 0,
        outdated: 0,
        failed: 0,
        lastRun: null,
      }
    );
  }

  function getMarketingServices(propertyId: string) {
    return data!.marketingServices.filter((s) => s.property_id === propertyId);
  }

  // ─── Summary Cards ────────────────────────────────────────────────────

  function renderSummaryCards() {
    if (activeTab === "deployments") {
      const cmsDeployments = data!.packageDeployments.filter(
        (d) => d.package_name === "@pandotic/universal-cms"
      );
      const installed = cmsDeployments.filter((d) => d.status === "active").length;
      const current = cmsDeployments.filter(
        (d) =>
          d.status === "active" &&
          d.installed_version &&
          d.installed_version === d.latest_version
      ).length;
      const outdated = cmsDeployments.filter(
        (d) =>
          d.status === "active" &&
          d.installed_version &&
          d.latest_version &&
          d.installed_version !== d.latest_version &&
          !d.pinned
      ).length;
      const notInstalled = data!.properties.length - cmsDeployments.length;

      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="CMS Installed" value={installed} color="text-white" />
          <SummaryCard label="Current" value={current} color="text-emerald-400" />
          <SummaryCard label="Update Available" value={outdated} color="text-amber-400" />
          <SummaryCard label="Not Installed" value={notInstalled} color="text-zinc-500" />
        </div>
      );
    }

    if (activeTab === "skills") {
      const totalActive = data!.skillCounts.reduce((sum, s) => sum + s.active, 0);
      const totalOutdated = data!.skillCounts.reduce((sum, s) => sum + s.outdated, 0);
      const totalFailed = data!.skillCounts.reduce((sum, s) => sum + s.failed, 0);
      const propertiesWithSkills = data!.skillCounts.filter((s) => s.active > 0).length;

      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Active Skills" value={totalActive} color="text-emerald-400" />
          <SummaryCard label="Outdated" value={totalOutdated} color="text-amber-400" />
          <SummaryCard label="Failed" value={totalFailed} color="text-red-400" />
          <SummaryCard label="Properties w/ Skills" value={propertiesWithSkills} color="text-white" />
        </div>
      );
    }

    if (activeTab === "marketing") {
      const active = data!.marketingServices.filter((s) => s.status === "active").length;
      const planned = data!.marketingServices.filter((s) => s.status === "planned").length;
      const propertiesWithMktg = new Set(data!.marketingServices.map((s) => s.property_id)).size;

      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Active Services" value={active} color="text-emerald-400" />
          <SummaryCard label="Planned" value={planned} color="text-blue-400" />
          <SummaryCard label="Properties w/ Marketing" value={propertiesWithMktg} color="text-white" />
          <SummaryCard label="Total Services" value={data!.marketingServices.length} color="text-zinc-400" />
        </div>
      );
    }

    const byOwner = { personal: 0, pandotic: 0, client: 0 };
    for (const p of data!.properties) {
      const key = p.ownership_type as keyof typeof byOwner;
      if (key in byOwner) byOwner[key]++;
    }

    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total Properties" value={data!.properties.length} color="text-white" />
        <SummaryCard label="Personal" value={byOwner.personal} color="text-blue-400" />
        <SummaryCard label="Pandotic" value={byOwner.pandotic} color="text-emerald-400" />
        <SummaryCard label="Client" value={byOwner.client} color="text-amber-400" />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Fleet Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {data.properties.length} propert{data.properties.length !== 1 ? "ies" : "y"} across the fleet
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
          >
            <option value="all">All owners</option>
            <option value="personal">Personal</option>
            <option value="pandotic">Pandotic</option>
            <option value="client">Client</option>
          </select>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-white text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary cards */}
      {renderSummaryCards()}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900">
              <th className="sticky left-0 z-10 bg-zinc-900 px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Property
              </th>
              {activeTab === "deployments" && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">CMS Version</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Modules</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Other Packages</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Last Sync</th>
                </>
              )}
              {activeTab === "skills" && (
                <>
                  <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400">Active</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400">Outdated</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400">Failed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Actions</th>
                </>
              )}
              {activeTab === "marketing" && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Active Services</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Status</th>
                </>
              )}
              {activeTab === "business" && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Domains</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">LLC</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filteredProperties.map((property) => (
              <tr key={property.id} className="transition-colors hover:bg-zinc-800/30">
                <td className="sticky left-0 z-10 bg-zinc-950 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        property.health_status === "healthy"
                          ? "bg-emerald-400"
                          : property.health_status === "degraded"
                            ? "bg-amber-400"
                            : property.health_status === "down"
                              ? "bg-red-400"
                              : "bg-zinc-600"
                      }`}
                    />
                    <div>
                      <Link
                        href={`/properties/${property.slug}`}
                        className="font-medium text-zinc-200 hover:text-white"
                      >
                        {property.name}
                      </Link>
                      <div className="text-xs text-zinc-500">{property.url}</div>
                    </div>
                  </div>
                </td>

                {activeTab === "deployments" && (
                  <DeploymentsCols
                    cmsDeployment={getCmsDeployment(property.id)}
                    otherDeployments={getDeployments(property.id).filter(
                      (d) => d.package_name !== "@pandotic/universal-cms"
                    )}
                  />
                )}
                {activeTab === "skills" && (
                  <SkillsCols counts={getSkillCounts(property.id)} />
                )}
                {activeTab === "marketing" && (
                  <MarketingCols services={getMarketingServices(property.id)} />
                )}
                {activeTab === "business" && (
                  <BusinessCols property={property} />
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProperties.length === 0 && (
          <div className="px-4 py-12 text-center text-zinc-500">
            No properties match the current filter.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

// ─── Deployments Columns ──────────────────────────────────────────────────

function DeploymentsCols({
  cmsDeployment,
  otherDeployments,
}: {
  cmsDeployment?: PackageDeployment;
  otherDeployments: PackageDeployment[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (!cmsDeployment) {
    return (
      <>
        <td className="px-4 py-3"><span className="text-xs text-zinc-600">Not installed</span></td>
        <td className="px-4 py-3"><span className="text-xs text-zinc-600">-</span></td>
        <td className="px-4 py-3">
          {otherDeployments.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {otherDeployments.map((d) => <VersionBadge key={d.id} deployment={d} />)}
            </div>
          ) : <span className="text-xs text-zinc-600">-</span>}
        </td>
        <td className="px-4 py-3"><span className="text-xs text-zinc-600">-</span></td>
      </>
    );
  }

  const isOutdated =
    cmsDeployment.installed_version &&
    cmsDeployment.latest_version &&
    cmsDeployment.installed_version !== cmsDeployment.latest_version;

  const moduleCount = cmsDeployment.enabled_modules.length;
  const bespokeCount = cmsDeployment.bespoke_modules.length;

  return (
    <>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
              cmsDeployment.status === "failed"
                ? "bg-red-500/10 text-red-400 ring-red-500/20"
                : isOutdated
                  ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
            }`}
          >
            v{cmsDeployment.installed_version ?? "?"}
          </span>
          {isOutdated && (
            <span className="flex items-center gap-0.5 text-xs text-amber-400">
              <ArrowUp className="h-3 w-3" />v{cmsDeployment.latest_version}
            </span>
          )}
          {cmsDeployment.pinned && <Pin className="h-3 w-3 text-blue-400" />}
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {moduleCount} module{moduleCount !== 1 ? "s" : ""}
          {bespokeCount > 0 && <span className="text-purple-400"> + {bespokeCount} bespoke</span>}
        </button>
        {expanded && (
          <div className="mt-2 flex flex-wrap gap-1">
            {cmsDeployment.enabled_modules.map((m) => (
              <span key={m} className="inline-flex rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{m}</span>
            ))}
            {cmsDeployment.bespoke_modules.map((m) => (
              <span key={m} className="inline-flex rounded-full bg-purple-900/30 px-2 py-0.5 text-xs text-purple-300">{m}</span>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {otherDeployments.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {otherDeployments.map((d) => <VersionBadge key={d.id} deployment={d} />)}
          </div>
        ) : <span className="text-xs text-zinc-600">-</span>}
      </td>
      <td className="px-4 py-3">
        {cmsDeployment.last_health_check_at ? (
          <span className="text-xs text-zinc-500">
            {new Date(cmsDeployment.last_health_check_at).toLocaleDateString()}
          </span>
        ) : <span className="text-xs text-zinc-600">Never</span>}
      </td>
    </>
  );
}

// ─── Version Badge ────────────────────────────────────────────────────────

function VersionBadge({ deployment }: { deployment: PackageDeployment }) {
  const shortName = deployment.package_name.replace("@pandotic/", "").replace("@universal-cms/", "");
  const isOutdated =
    deployment.installed_version &&
    deployment.latest_version &&
    deployment.installed_version !== deployment.latest_version;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        deployment.status === "failed"
          ? "bg-red-500/10 text-red-400 ring-red-500/20"
          : isOutdated
            ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
            : "bg-zinc-700/30 text-zinc-400 ring-zinc-600/30"
      }`}
      title={`${deployment.package_name} v${deployment.installed_version ?? "?"}`}
    >
      {shortName} <span className="font-mono">v{deployment.installed_version ?? "?"}</span>
    </span>
  );
}

// ─── Skills Columns ───────────────────────────────────────────────────────

function SkillsCols({ counts }: { counts: { active: number; outdated: number; failed: number } }) {
  const hasSkills = counts.active > 0 || counts.outdated > 0 || counts.failed > 0;

  return (
    <>
      <td className="px-4 py-3 text-center">
        {counts.active > 0 ? (
          <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-emerald-500/10 px-2 text-xs font-medium text-emerald-400">{counts.active}</span>
        ) : <span className="text-xs text-zinc-600">0</span>}
      </td>
      <td className="px-4 py-3 text-center">
        {counts.outdated > 0 ? (
          <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-amber-500/10 px-2 text-xs font-medium text-amber-400">{counts.outdated}</span>
        ) : <span className="text-xs text-zinc-600">0</span>}
      </td>
      <td className="px-4 py-3 text-center">
        {counts.failed > 0 ? (
          <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-red-500/10 px-2 text-xs font-medium text-red-400">{counts.failed}</span>
        ) : <span className="text-xs text-zinc-600">0</span>}
      </td>
      <td className="px-4 py-3">
        {hasSkills ? (
          <Link href="/skills/matrix" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200">
            View matrix <ExternalLink className="h-3 w-3" />
          </Link>
        ) : (
          <Link href="/skills/deploy" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
            Deploy skills <Plus className="h-3 w-3" />
          </Link>
        )}
      </td>
    </>
  );
}

// ─── Marketing Columns ────────────────────────────────────────────────────

function MarketingCols({ services }: { services: MarketingService[] }) {
  const activeServices = services.filter((s) => s.status === "active");
  const providers = [...new Set(services.map((s) => s.provider))];

  return (
    <>
      <td className="px-4 py-3">
        {services.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {services.map((s) => (
              <span
                key={s.id}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_COLORS[s.status] ?? STATUS_COLORS.planned}`}
                title={`${SERVICE_LABELS[s.service_type] ?? s.service_type}: ${s.status}`}
              >
                {SERVICE_LABELS[s.service_type] ?? s.service_type}
              </span>
            ))}
          </div>
        ) : <span className="text-xs text-zinc-600">No services</span>}
      </td>
      <td className="px-4 py-3">
        {providers.length > 0 ? (
          <span className="text-xs text-zinc-400">{providers.join(", ")}</span>
        ) : <span className="text-xs text-zinc-600">-</span>}
      </td>
      <td className="px-4 py-3">
        {activeServices.length > 0 ? (
          <span className="text-xs text-emerald-400">{activeServices.length} active</span>
        ) : services.length > 0 ? (
          <span className="text-xs text-zinc-500">{services.length} planned</span>
        ) : <span className="text-xs text-zinc-600">-</span>}
      </td>
    </>
  );
}

// ─── Business Columns ─────────────────────────────────────────────────────

function BusinessCols({ property }: { property: Property }) {
  return (
    <>
      <td className="px-4 py-3">
        {property.business_category ? (
          <span className="text-xs capitalize text-zinc-300">{property.business_category.replace("_", " ")}</span>
        ) : <span className="text-xs text-zinc-600">-</span>}
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-zinc-300">{OWNERSHIP_LABELS[property.ownership_type] ?? property.ownership_type}</span>
        {property.client_name && <span className="ml-1 text-xs text-zinc-500">({property.client_name})</span>}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium capitalize ${STAGE_COLORS[property.business_stage] ?? "text-zinc-400"}`}>
          {property.business_stage}
        </span>
      </td>
      <td className="px-4 py-3">
        {property.domains.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-zinc-300">{property.domains[0]}</span>
            {property.domains.length > 1 && <span className="text-xs text-zinc-500">+{property.domains.length - 1}</span>}
          </div>
        ) : <span className="text-xs text-zinc-600">-</span>}
      </td>
      <td className="px-4 py-3">
        {property.llc_entity ? (
          <span className="text-xs text-zinc-300">{property.llc_entity}</span>
        ) : <span className="text-xs text-zinc-600">-</span>}
      </td>
    </>
  );
}
