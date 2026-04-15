"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Github,
  Globe,
  Bot,
  FileCode,
  Monitor,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

type PlatformType = "nextjs_supabase" | "wordpress" | "static" | "mindpal" | "external" | "other";

interface PlatformOption {
  id: PlatformType;
  label: string;
  description: string;
  icon: typeof Globe;
  needsGithub: boolean;
}

interface GithubRepo {
  full_name: string;
  name: string;
  owner: string;
  description: string | null;
  language: string | null;
  default_branch: string;
  private: boolean;
  html_url: string;
  updated_at: string;
}

const PLATFORMS: PlatformOption[] = [
  { id: "nextjs_supabase", label: "Next.js + Supabase", description: "Full-stack app with CMS support", icon: FileCode, needsGithub: true },
  { id: "wordpress", label: "WordPress", description: "WordPress site — marketing only", icon: Globe, needsGithub: false },
  { id: "static", label: "Static Site", description: "HTML/CSS or static generator", icon: Monitor, needsGithub: true },
  { id: "mindpal", label: "MindPal", description: "MindPal chatbot deployment", icon: Bot, needsGithub: false },
  { id: "external", label: "External Service", description: "Third-party platform or tool", icon: Globe, needsGithub: false },
  { id: "other", label: "Other", description: "Custom or unlisted platform", icon: FileCode, needsGithub: false },
];

const CATEGORIES = [
  { value: "", label: "Select category..." },
  { value: "saas", label: "SaaS" },
  { value: "marketplace", label: "Marketplace" },
  { value: "directory", label: "Directory" },
  { value: "content_site", label: "Content Site" },
  { value: "agency_client", label: "Agency Client" },
  { value: "internal_tool", label: "Internal Tool" },
];

// ─── Page ─────────────────────────────────────────────────────────────────

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Platform
  const [platform, setPlatform] = useState<PlatformType | null>(null);

  // Step 2: Connect
  const [ghToken, setGhToken] = useState<string>("");
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [repoSearch, setRepoSearch] = useState("");

  // Step 2: Detection
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState<{
    hasCms: boolean;
    cmsVersion: string | null;
    detectedPlatform: string;
    enabledModules: string[];
    projectName: string | null;
  } | null>(null);

  // Step 2 alt: Manual
  const [manualName, setManualName] = useState("");
  const [manualUrl, setManualUrl] = useState("");

  // Step 3: Configure
  const [projectName, setProjectName] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [category, setCategory] = useState("");
  const [ownership, setOwnership] = useState("pandotic");
  const [clientName, setClientName] = useState("");
  const [domains, setDomains] = useState("");

  // Load GitHub token from localStorage
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("gh_token") : null;
    if (stored) setGhToken(stored);
  }, []);

  const selectedPlatform = PLATFORMS.find((p) => p.id === platform);
  const needsGithub = selectedPlatform?.needsGithub ?? false;

  async function loadRepos() {
    if (!ghToken) return;
    setLoadingRepos(true);
    try {
      const res = await fetch(`/api/github/repos?token=${encodeURIComponent(ghToken)}`);
      const json = await res.json();
      setRepos(json.data ?? []);
      if (typeof window !== "undefined") localStorage.setItem("gh_token", ghToken);
    } catch {
      setError("Failed to load GitHub repos");
    }
    setLoadingRepos(false);
  }

  async function detectCms(repoFullName: string) {
    setDetecting(true);
    try {
      const res = await fetch(
        `/api/github/detect?token=${encodeURIComponent(ghToken)}&repo=${encodeURIComponent(repoFullName)}`
      );
      const json = await res.json();
      if (json.data) {
        setDetected(json.data);
        if (json.data.projectName) setProjectName(json.data.projectName);
        if (json.data.detectedPlatform && json.data.detectedPlatform !== "other") {
          setPlatform(json.data.detectedPlatform as PlatformType);
        }
      }
    } catch {
      // detection failed — non-critical
    }
    setDetecting(false);
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    const repo = repos.find((r) => r.full_name === selectedRepo);
    const name = needsGithub ? (projectName || repo?.name || "") : (projectName || manualName);
    const url = needsGithub ? (projectUrl || repo?.html_url || "") : (projectUrl || manualUrl);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          url,
          property_type: platform === "mindpal" ? "app" : "site",
          platform_type: platform,
          github_repo: repo?.full_name ?? null,
          github_default_branch: repo?.default_branch ?? "main",
          cms_installed: detected?.hasCms ?? false,
          enabled_modules: detected?.enabledModules ?? [],
          onboarding_status: "complete",
          business_category: category || null,
          ownership_type: ownership,
          client_name: ownership === "client" ? clientName : null,
          domains: domains ? domains.split(",").map((d) => d.trim()).filter(Boolean) : [],
          status: "active",
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      router.push("/fleet?tab=business");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create project");
    }
    setSaving(false);
  }

  const filteredRepos = repos.filter((r) =>
    !repoSearch || r.full_name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  // ─── Step Validation ──────────────────────────────────────────────────

  const canAdvanceStep1 = !!platform;
  const canAdvanceStep2 = needsGithub ? !!selectedRepo : (!!manualName && !!manualUrl);
  const canSubmit = !!(projectName || (needsGithub ? selectedRepo : manualName));

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/fleet" className="mb-4 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
          <ArrowLeft className="h-4 w-4" /> Back to Fleet
        </Link>
        <h1 className="text-2xl font-semibold text-white">Add Project</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Register a new project in the fleet. Connect a GitHub repo or add manually.
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                s < step
                  ? "bg-emerald-500/20 text-emerald-400"
                  : s === step
                    ? "bg-white/10 text-white ring-2 ring-white/20"
                    : "bg-zinc-800 text-zinc-600"
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 3 && <div className={`h-px w-12 ${s < step ? "bg-emerald-500/40" : "bg-zinc-800"}`} />}
          </div>
        ))}
        <span className="ml-3 text-xs text-zinc-500">
          {step === 1 ? "Platform" : step === 2 ? "Connect" : "Configure"}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Step 1: Platform */}
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-white">What type of project?</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLATFORMS.map((p) => {
              const Icon = p.icon;
              const selected = platform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                    selected
                      ? "border-white/30 bg-white/5 ring-1 ring-white/10"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <Icon className={`mt-0.5 h-5 w-5 ${selected ? "text-white" : "text-zinc-500"}`} />
                  <div>
                    <p className={`text-sm font-medium ${selected ? "text-white" : "text-zinc-300"}`}>{p.label}</p>
                    <p className="text-xs text-zinc-500">{p.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Connect (GitHub) */}
      {step === 2 && needsGithub && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">Connect GitHub Repository</h2>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">GitHub Token</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={ghToken}
                onChange={(e) => setGhToken(e.target.value)}
                placeholder="ghp_..."
                className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
              />
              <button
                onClick={loadRepos}
                disabled={!ghToken || loadingRepos}
                className="flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50"
              >
                {loadingRepos ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
                Load Repos
              </button>
            </div>
          </div>

          {repos.length > 0 && (
            <>
              <div>
                <input
                  type="text"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder="Search repos..."
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-zinc-800 p-2">
                {filteredRepos.map((repo) => (
                  <button
                    key={repo.full_name}
                    onClick={() => {
                      setSelectedRepo(repo.full_name);
                      setProjectName(repo.name);
                      setProjectUrl(repo.html_url);
                      detectCms(repo.full_name);
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      selectedRepo === repo.full_name
                        ? "bg-white/10 text-white"
                        : "text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    <div>
                      <span className="font-medium">{repo.full_name}</span>
                      {repo.description && (
                        <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{repo.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      {repo.language && <span>{repo.language}</span>}
                      {repo.private && <span className="rounded bg-zinc-800 px-1.5 py-0.5">Private</span>}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Detection result */}
          {detecting && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Detecting CMS...
            </div>
          )}
          {detected && !detecting && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <div className="flex items-center gap-2 text-sm">
                {detected.hasCms ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">CMS detected</span>
                    <span className="text-zinc-500">v{detected.cmsVersion}</span>
                    {detected.enabledModules.length > 0 && (
                      <span className="text-zinc-500">· {detected.enabledModules.length} modules</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="h-4 w-4 text-center text-zinc-600">—</span>
                    <span className="text-zinc-500">No CMS installed</span>
                    <span className="text-zinc-600">· {detected.detectedPlatform}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2 alt: Manual (non-GitHub) */}
      {step === 2 && !needsGithub && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">Project Details</h2>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Project Name</label>
            <input
              type="text"
              value={manualName}
              onChange={(e) => { setManualName(e.target.value); setProjectName(e.target.value); }}
              placeholder="My WordPress Site"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">URL</label>
            <input
              type="text"
              value={manualUrl}
              onChange={(e) => { setManualUrl(e.target.value); setProjectUrl(e.target.value); }}
              placeholder="https://example.com"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Step 3: Configure */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">Configure Project</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">URL</label>
              <input
                type="text"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Ownership</label>
              <select
                value={ownership}
                onChange={(e) => setOwnership(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
              >
                <option value="personal">Personal</option>
                <option value="pandotic">Pandotic</option>
                <option value="client">Client</option>
              </select>
            </div>
          </div>

          {ownership === "client" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Domains (comma-separated)</label>
            <input
              type="text"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              placeholder="example.com, www.example.com"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="text-xs font-medium text-zinc-400">Summary</h3>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="text-zinc-500">Platform:</dt>
                <dd className="text-zinc-300">{selectedPlatform?.label}</dd>
              </div>
              {selectedRepo && (
                <div className="flex gap-2">
                  <dt className="text-zinc-500">Repo:</dt>
                  <dd className="text-zinc-300">{selectedRepo}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="text-zinc-500">Name:</dt>
                <dd className="text-zinc-300">{projectName || "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-zinc-500">URL:</dt>
                <dd className="text-zinc-300">{projectUrl || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Navigation */}
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
            disabled={step === 1 ? !canAdvanceStep1 : !canAdvanceStep2}
            className="flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? "Creating..." : "Create Project"}
          </button>
        )}
      </div>
    </div>
  );
}
