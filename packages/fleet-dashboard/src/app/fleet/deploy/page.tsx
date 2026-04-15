"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Loader2,
  Package,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

interface Property {
  id: string;
  name: string;
  slug: string;
  url: string;
  github_repo: string | null;
  cms_installed: boolean;
  platform_type: string;
  enabled_modules: string[];
}

interface Preset {
  key: string;
  name: string;
  description: string;
  modules: string[];
}

const PRESETS: Preset[] = [
  {
    key: "appMarketing",
    name: "App Marketing",
    description: "Landing pages, blog, media, basic forms",
    modules: ["contentPages", "landingPages", "mediaLibrary", "forms", "ctaManager", "errorLog", "activityLog"],
  },
  {
    key: "blog",
    name: "Blog / Content",
    description: "Articles, SEO tools, link management",
    modules: ["contentPages", "mediaLibrary", "listicles", "seo", "redirects", "linkChecker", "internalLinks", "imagesSeo", "errorLog", "activityLog"],
  },
  {
    key: "directory",
    name: "Directory / Marketplace",
    description: "Entities, categories, reviews, affiliates, full SEO",
    modules: ["contentPages", "mediaLibrary", "directory", "categories", "frameworks", "glossary", "certifications", "reviews", "affiliates", "clickAnalytics", "ratings", "seo", "redirects", "linkChecker", "internalLinks", "forms", "ctaManager", "errorLog", "activityLog", "bulkImport"],
  },
  {
    key: "full",
    name: "Full Platform",
    description: "Everything enabled — all 30 modules",
    modules: [
      "contentPages", "landingPages", "mediaLibrary", "listicles", "brandGuide",
      "directory", "categories", "frameworks", "glossary", "certifications",
      "careerHub", "reviews", "affiliates", "clickAnalytics", "merchants",
      "ratings", "forms", "ctaManager", "seo", "redirects", "linkChecker",
      "internalLinks", "imagesSeo", "compareTools", "assessmentTool",
      "resourcesPage", "smallBusinessPage", "errorLog", "activityLog",
      "bulkImport", "apiUsage",
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────

export default function DeployPage() {
  const [step, setStep] = useState(1);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ prUrl: string; branch: string } | null>(null);

  // Step 1
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  // Step 2
  const [selectedPreset, setSelectedPreset] = useState("appMarketing");
  const [customModules, setCustomModules] = useState<string[]>([]);

  // GitHub token
  const [ghToken, setGhToken] = useState("");

  useEffect(() => {
    loadEligibleProperties();
    const stored = typeof window !== "undefined" ? localStorage.getItem("gh_token") : null;
    if (stored) setGhToken(stored);
  }, []);

  async function loadEligibleProperties() {
    try {
      const res = await fetch("/api/fleet/dashboard");
      const json = await res.json();
      // Properties with github_repo but no CMS installed
      const eligible = (json.data?.properties ?? []).filter(
        (p: Property) => p.github_repo && !p.cms_installed && p.platform_type === "nextjs_supabase"
      );
      setProperties(eligible);
    } catch {
      setError("Failed to load properties");
    }
    setLoading(false);
  }

  const preset = PRESETS.find((p) => p.key === selectedPreset);
  const activeModules = customModules.length > 0 ? customModules : (preset?.modules ?? []);
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  function toggleModule(mod: string) {
    // Initialize custom modules from preset if first toggle
    if (customModules.length === 0 && preset) {
      const initial = [...preset.modules];
      if (initial.includes(mod)) {
        setCustomModules(initial.filter((m) => m !== mod));
      } else {
        setCustomModules([...initial, mod]);
      }
    } else {
      setCustomModules((prev) =>
        prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
      );
    }
  }

  async function handleDeploy() {
    if (!selectedPropertyId || !ghToken) return;
    setDeploying(true);
    setError(null);

    try {
      if (typeof window !== "undefined") localStorage.setItem("gh_token", ghToken);

      const res = await fetch("/api/fleet/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          ghToken,
          preset: selectedPreset,
          modules: activeModules,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

      setResult(json.data);
      setStep(4); // success
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deploy failed");
    }
    setDeploying(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading eligible properties...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/fleet" className="mb-4 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
          <ArrowLeft className="h-4 w-4" /> Back to Fleet
        </Link>
        <h1 className="text-2xl font-semibold text-white">Deploy CMS</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Install @pandotic/universal-cms on a property via GitHub PR.
        </p>
      </div>

      {/* Step indicator */}
      {step < 4 && (
        <div className="mb-8 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                  s < step ? "bg-emerald-500/20 text-emerald-400"
                    : s === step ? "bg-white/10 text-white ring-2 ring-white/20"
                    : "bg-zinc-800 text-zinc-600"
                }`}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={`h-px w-12 ${s < step ? "bg-emerald-500/40" : "bg-zinc-800"}`} />}
            </div>
          ))}
          <span className="ml-3 text-xs text-zinc-500">
            {step === 1 ? "Select Property" : step === 2 ? "Configure Modules" : "Review & Deploy"}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Step 1: Select property */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">Select Property</h2>
          <p className="text-sm text-zinc-500">
            Properties with a GitHub repo and no CMS installed.
          </p>

          {properties.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-zinc-600" />
              <p className="mt-3 text-sm text-zinc-400">No eligible properties</p>
              <p className="mt-1 text-xs text-zinc-600">
                All GitHub-connected properties already have CMS installed, or no properties have GitHub repos linked.
              </p>
              <Link href="/fleet/onboard" className="mt-4 inline-block text-sm text-zinc-400 underline hover:text-zinc-300">
                Add a new project
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {properties.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPropertyId(p.id)}
                  className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all ${
                    selectedPropertyId === p.id
                      ? "border-white/30 bg-white/5"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-zinc-500">{p.github_repo}</p>
                  </div>
                  <span className="text-xs text-zinc-600">{p.url}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Configure modules */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">Choose Module Preset</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => { setSelectedPreset(p.key); setCustomModules([]); }}
                className={`rounded-lg border p-4 text-left transition-all ${
                  selectedPreset === p.key
                    ? "border-white/30 bg-white/5"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <p className="text-sm font-medium text-white">{p.name}</p>
                <p className="text-xs text-zinc-500">{p.description}</p>
                <p className="mt-2 text-xs text-zinc-600">{p.modules.length} modules</p>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-zinc-400">Active Modules ({activeModules.length})</h3>
            <div className="flex flex-wrap gap-1.5">
              {(preset?.modules ?? PRESETS[3].modules).map((mod) => {
                const isActive = activeModules.includes(mod);
                return (
                  <button
                    key={mod}
                    onClick={() => toggleModule(mod)}
                    className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                        : "bg-zinc-800 text-zinc-600 ring-1 ring-zinc-700"
                    }`}
                  >
                    {mod}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review & Deploy */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">Review & Deploy</h2>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
            <div className="flex gap-2 text-sm">
              <span className="text-zinc-500">Property:</span>
              <span className="text-white">{selectedProperty?.name}</span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-zinc-500">Repo:</span>
              <span className="text-zinc-300">{selectedProperty?.github_repo}</span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-zinc-500">Preset:</span>
              <span className="text-zinc-300">{preset?.name}</span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-zinc-500">Modules:</span>
              <span className="text-zinc-300">{activeModules.length}</span>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {activeModules.map((m) => (
                <span key={m} className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
            <h3 className="text-sm font-medium text-zinc-400">What this will do</h3>
            <ul className="space-y-1 text-xs text-zinc-500">
              <li>Create a feature branch on {selectedProperty?.github_repo}</li>
              <li>Add <code className="rounded bg-zinc-800 px-1 text-zinc-400">src/cms.config.ts</code> with {activeModules.length} modules</li>
              <li>Add <code className="rounded bg-zinc-800 px-1 text-zinc-400">src/app/api/admin/health/route.ts</code> for fleet monitoring</li>
              <li>Open a pull request for review</li>
            </ul>
            <p className="text-xs text-amber-500/80">
              You'll still need to run <code className="rounded bg-zinc-800 px-1">pnpm add @pandotic/universal-cms</code> and apply Supabase migrations after merging.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">GitHub Token</label>
            <input
              type="password"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && result && (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-lg font-medium text-white">PR Created</h2>
          <p className="text-sm text-zinc-400">
            A pull request has been created to install the CMS on {selectedProperty?.name}.
          </p>
          <a
            href={result.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
          >
            View PR on GitHub <ExternalLink className="h-4 w-4" />
          </a>
          <div className="pt-4">
            <Link href="/fleet?tab=deployments" className="text-sm text-zinc-500 hover:text-zinc-300">
              Return to Fleet Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 4 && (
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !selectedPropertyId : false}
              className="flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleDeploy}
              disabled={!ghToken || deploying}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {deploying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              {deploying ? "Creating PR..." : "Deploy CMS"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
