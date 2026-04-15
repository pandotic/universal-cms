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
  PinOff,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Check,
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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

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
      const res = await fetch("/api/deployments/sync", { method: "POST" });
      const json = await res.json();
      const summary = json.data?.summary;
      await loadData();
      if (summary) {
        setToast({
          message: `Synced ${summary.synced} of ${summary.total} properties. ${summary.unreachable > 0 ? `${summary.unreachable} unreachable.` : ""}`,
          type: summary.unreachable > 0 ? "error" : "success",
        });
      }
    } catch {
      setToast({ message: "Sync failed — check network.", type: "error" });
    }
    setSyncing(false);
  }

  async function handleTogglePin(deploymentId: string, currentlyPinned: boolean) {
    try {
      await fetch(`/api/deployments/${deploymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !currentlyPinned }),
      });
      await loadData();
      setToast({ message: currentlyPinned ? "Version unpinned" : "Version pinned", type: "success" });
    } catch {
      setToast({ message: "Failed to update pin status", type: "error" });
    }
  }

  async function handleUpdateProperty(propertyId: string, updates: Record<string, unknown>) {
    try {
      await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await loadData();
      setToast({ message: "Property updated", type: "success" });
    } catch {
      setToast({ message: "Failed to update property", type: "error" });
    }
  }

  async function handleAddMarketingService(propertyId: string, serviceType: string) {
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
      await loadData();
      setToast({ message: `Added ${SERVICE_LABELS[serviceType] ?? serviceType} service`, type: "success" });
    } catch {
      setToast({ message: "Failed to add service", type: "error" });
    }
  }

  async function handleUpdateMarketingService(serviceId: string, updates: Record<string, string>) {
    try {
      await fetch(`/api/marketing/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await loadData();
    } catch {
      setToast({ message: "Failed to update service", type: "error" });
    }
  }

  async function handleDeleteMarketingService(serviceId: string) {
    try {
      await fetch(`/api/marketing/${serviceId}`, { method: "DELETE" });
      await loadData();
      setToast({ message: "Service removed", type: "success" });
    } catch {
      setToast({ message: "Failed to remove service", type: "error" });
    }
  }

  async function handleRegisterPackage(propertyId: string, packageName: string, version: string, category: string) {
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
      await loadData();
      setShowRegisterModal(false);
      setToast({ message: `Registered ${packageName} v${version}`, type: "success" });
    } catch {
      setToast({ message: "Failed to register package", type: "error" });
    }
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
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-20 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all ${
            toast.type === "success"
              ? "border-emerald-500/20 bg-emerald-950 text-emerald-300"
              : "border-red-500/20 bg-red-950 text-red-300"
          }`}
        >
          {toast.type === "success" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Register Package Modal */}
      {showRegisterModal && (
        <RegisterPackageModal
          properties={data.properties}
          onSubmit={handleRegisterPackage}
          onClose={() => setShowRegisterModal(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Fleet Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {data.properties.length} propert{data.properties.length !== 1 ? "ies" : "y"} across the fleet
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/fleet/onboard"
            className="flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Add Project
          </Link>
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
          {activeTab === "deployments" && (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
            >
              <Plus className="h-4 w-4" />
              Register Package
            </button>
          )}
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
                    onTogglePin={handleTogglePin}
                  />
                )}
                {activeTab === "skills" && (
                  <SkillsCols propertySlug={property.slug} counts={getSkillCounts(property.id)} />
                )}
                {activeTab === "marketing" && (
                  <MarketingCols
                    propertyId={property.id}
                    services={getMarketingServices(property.id)}
                    onAddService={handleAddMarketingService}
                    onUpdateService={handleUpdateMarketingService}
                    onDeleteService={handleDeleteMarketingService}
                  />
                )}
                {activeTab === "business" && (
                  <BusinessCols
                    property={property}
                    onUpdate={(updates) => handleUpdateProperty(property.id, updates)}
                  />
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProperties.length === 0 && (
          <div className="px-4 py-12 text-center">
            {data.properties.length === 0 ? (
              <div>
                <Package className="mx-auto h-8 w-8 text-zinc-600" />
                <p className="mt-3 text-sm font-medium text-zinc-400">No properties in the fleet yet</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Add your first property in{" "}
                  <Link href="/properties" className="text-zinc-400 underline hover:text-zinc-300">
                    Properties
                  </Link>{" "}
                  to start tracking deployments, skills, and marketing.
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No properties match the current filter.</p>
            )}
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
  onTogglePin,
}: {
  cmsDeployment?: PackageDeployment;
  otherDeployments: PackageDeployment[];
  onTogglePin: (deploymentId: string, currentlyPinned: boolean) => void;
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
          <button
            onClick={() => onTogglePin(cmsDeployment.id, cmsDeployment.pinned)}
            className={`rounded p-0.5 transition-colors ${
              cmsDeployment.pinned
                ? "text-blue-400 hover:text-blue-300"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
            title={cmsDeployment.pinned ? "Unpin version" : "Pin version"}
          >
            {cmsDeployment.pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
          </button>
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

function SkillsCols({ propertySlug, counts }: { propertySlug: string; counts: { active: number; outdated: number; failed: number } }) {
  const hasSkills = counts.active > 0 || counts.outdated > 0 || counts.failed > 0;
  const total = counts.active + counts.outdated + counts.failed;

  return (
    <>
      <td className="px-4 py-3 text-center">
        {counts.active > 0 ? (
          <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-emerald-500/10 px-2 text-xs font-medium text-emerald-400">{counts.active}</span>
        ) : <span className="text-xs text-zinc-600">0</span>}
      </td>
      <td className="px-4 py-3 text-center">
        {counts.outdated > 0 ? (
          <Link href="/skills/matrix" className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-amber-500/10 px-2 text-xs font-medium text-amber-400 hover:bg-amber-500/20" title="View outdated skills">
            {counts.outdated}
          </Link>
        ) : <span className="text-xs text-zinc-600">0</span>}
      </td>
      <td className="px-4 py-3 text-center">
        {counts.failed > 0 ? (
          <Link href="/skills/matrix" className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-red-500/10 px-2 text-xs font-medium text-red-400 hover:bg-red-500/20" title="View failed skills">
            {counts.failed}
          </Link>
        ) : <span className="text-xs text-zinc-600">0</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {hasSkills ? (
            <Link href="/skills/matrix" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200">
              Matrix <ExternalLink className="h-3 w-3" />
            </Link>
          ) : (
            <Link href="/skills/deploy" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
              Deploy <Plus className="h-3 w-3" />
            </Link>
          )}
          {hasSkills && (
            <Link href={`/properties/${propertySlug}`} className="text-xs text-zinc-600 hover:text-zinc-400">
              Details
            </Link>
          )}
        </div>
      </td>
    </>
  );
}

// ─── Marketing Columns ────────────────────────────────────────────────────

const STATUS_CYCLE: Record<string, string> = {
  planned: "active",
  active: "paused",
  paused: "active",
  completed: "planned",
};

const ALL_SERVICE_TYPES = ["seo", "content", "social", "paid_ads", "email", "analytics", "branding", "pr"] as const;

function MarketingCols({
  propertyId,
  services,
  onAddService,
  onUpdateService,
  onDeleteService,
}: {
  propertyId: string;
  services: MarketingService[];
  onAddService: (propertyId: string, serviceType: string) => void;
  onUpdateService: (serviceId: string, updates: Record<string, string>) => void;
  onDeleteService: (serviceId: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const activeServices = services.filter((s) => s.status === "active");
  const providers = [...new Set(services.map((s) => s.provider))];
  const existingTypes = new Set(services.map((s) => s.service_type));
  const availableTypes = ALL_SERVICE_TYPES.filter((t) => !existingTypes.has(t));

  return (
    <>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1">
          {services.map((s) => (
            <span
              key={s.id}
              className={`group inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset cursor-pointer ${STATUS_COLORS[s.status] ?? STATUS_COLORS.planned}`}
              title={`Click to change status (${s.status} → ${STATUS_CYCLE[s.status] ?? "planned"})`}
              onClick={() => onUpdateService(s.id, { status: STATUS_CYCLE[s.status] ?? "planned" })}
            >
              {SERVICE_LABELS[s.service_type] ?? s.service_type}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteService(s.id);
                }}
                className="hidden group-hover:inline-flex -mr-0.5 ml-0.5 rounded-full p-0.5 hover:bg-white/10"
                title="Remove service"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          {availableTypes.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-zinc-700 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400"
                title="Add service"
              >
                <Plus className="h-3 w-3" />
              </button>
              {showAdd && (
                <div className="absolute left-0 top-7 z-20 rounded-md border border-zinc-700 bg-zinc-800 py-1 shadow-lg">
                  {availableTypes.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        onAddService(propertyId, t);
                        setShowAdd(false);
                      }}
                      className="block w-full whitespace-nowrap px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-700"
                    >
                      {SERVICE_LABELS[t] ?? t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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

const BUSINESS_CATEGORIES = [
  { value: "", label: "—" },
  { value: "saas", label: "SaaS" },
  { value: "marketplace", label: "Marketplace" },
  { value: "directory", label: "Directory" },
  { value: "content_site", label: "Content Site" },
  { value: "agency_client", label: "Agency Client" },
  { value: "internal_tool", label: "Internal Tool" },
];

const OWNERSHIP_OPTIONS = [
  { value: "personal", label: "Personal" },
  { value: "pandotic", label: "Pandotic" },
  { value: "client", label: "Client" },
];

const STAGE_OPTIONS = [
  { value: "idea", label: "Idea" },
  { value: "development", label: "Development" },
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "sunset", label: "Sunset" },
];

function InlineSelect({
  value,
  options,
  onChange,
  className = "",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded border-0 bg-transparent py-0 pl-0 pr-5 text-xs focus:ring-1 focus:ring-zinc-600 cursor-pointer ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-zinc-800">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function InlineText({
  value,
  placeholder,
  onSave,
}: {
  value: string;
  placeholder: string;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onSave(draft);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (draft !== value) onSave(draft);
            setEditing(false);
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        autoFocus
        className="w-full rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300 focus:border-zinc-500 focus:outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className="text-left text-xs text-zinc-300 hover:text-white"
      title="Click to edit"
    >
      {value || <span className="text-zinc-600">{placeholder}</span>}
    </button>
  );
}

function BusinessCols({
  property,
  onUpdate,
}: {
  property: Property;
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  return (
    <>
      <td className="px-4 py-3">
        <InlineSelect
          value={property.business_category ?? ""}
          options={BUSINESS_CATEGORIES}
          onChange={(val) => onUpdate({ business_category: val || null })}
          className="text-zinc-300"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <InlineSelect
            value={property.ownership_type}
            options={OWNERSHIP_OPTIONS}
            onChange={(val) => onUpdate({ ownership_type: val })}
            className="text-zinc-300"
          />
          {property.ownership_type === "client" && (
            <InlineText
              value={property.client_name ?? ""}
              placeholder="Client name"
              onSave={(val) => onUpdate({ client_name: val || null })}
            />
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <InlineSelect
          value={property.business_stage}
          options={STAGE_OPTIONS}
          onChange={(val) => onUpdate({ business_stage: val })}
          className={`font-medium ${STAGE_COLORS[property.business_stage] ?? "text-zinc-400"}`}
        />
      </td>
      <td className="px-4 py-3">
        <InlineText
          value={property.domains.join(", ")}
          placeholder="Add domains"
          onSave={(val) => onUpdate({ domains: val ? val.split(",").map((d) => d.trim()).filter(Boolean) : [] })}
        />
      </td>
      <td className="px-4 py-3">
        <InlineText
          value={property.llc_entity ?? ""}
          placeholder="LLC entity"
          onSave={(val) => onUpdate({ llc_entity: val || null })}
        />
      </td>
    </>
  );
}

// ─── Register Package Modal ───────────────────────────────────────────────

function RegisterPackageModal({
  properties,
  onSubmit,
  onClose,
}: {
  properties: Property[];
  onSubmit: (propertyId: string, packageName: string, version: string, category: string) => void;
  onClose: () => void;
}) {
  const [propertyId, setPropertyId] = useState("");
  const [packageName, setPackageName] = useState("@pandotic/universal-cms");
  const [version, setVersion] = useState("");
  const [category, setCategory] = useState("cms");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Register Package</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Manually register a package deployment for sites without a health endpoint.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Property</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Select property...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Package Name</label>
            <select
              value={packageName}
              onChange={(e) => {
                setPackageName(e.target.value);
                if (e.target.value === "@pandotic/universal-cms") setCategory("cms");
                else if (e.target.value === "@pandotic/skill-library") setCategory("library");
                else if (e.target.value === "@universal-cms/admin-ui") setCategory("ui");
              }}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
            >
              <option value="@pandotic/universal-cms">@pandotic/universal-cms</option>
              <option value="@pandotic/skill-library">@pandotic/skill-library</option>
              <option value="@universal-cms/admin-ui">@universal-cms/admin-ui</option>
              <option value="custom">Custom package...</option>
            </select>
          </div>

          {packageName === "custom" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Custom Package Name</label>
              <input
                type="text"
                placeholder="@scope/package-name"
                onChange={(e) => setPackageName(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Installed Version</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="0.1.0"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
            >
              <option value="cms">CMS</option>
              <option value="library">Library</option>
              <option value="ui">UI</option>
              <option value="tool">Tool</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(propertyId, packageName, version, category)}
            disabled={!propertyId || !packageName || !version}
            className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
