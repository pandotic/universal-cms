"use client";

import { useEffect, useMemo, useState } from "react";
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
import { modulePresets } from "@pandotic/universal-cms/config";

type PresetKey = keyof typeof modulePresets;

const PRESET_ORDER: PresetKey[] = ["appMarketing", "blog", "directory", "full"];

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

interface DetectResult {
  hasCms: boolean;
  cmsVersion: string | null;
  detectedPlatform: string;
  enabledModules: string[];
  recommendedPreset: string | null;
  projectName: string | null;
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

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createProgress, setCreateProgress] = useState<{ done: number; total: number; current: string } | null>(null);

  // Step 1: Platform
  const [platform, setPlatform] = useState<PlatformType | null>(null);

  // Step 2: Connect (GitHub)
  const [ghToken, setGhToken] = useState<string>("");
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [repoSearch, setRepoSearch] = useState("");
  const [githubAuth, setGithubAuth] = useState<{ authenticated: boolean; login?: string; name?: string; avatar_url?: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Step 2: Detection (one result per selected repo)
  const [detectedByRepo, setDetectedByRepo] = useState<Record<string, DetectResult>>({});
  const [detectingRepos, setDetectingRepos] = useState<Set<string>>(new Set());

  // Step 2 alt: Manual (single project)
  const [manualName, setManualName] = useState("");
  const [manualUrl, setManualUrl] = useState("");

  // Step 3: Configure (shared for multi-repo, or single for manual)
  const [projectName, setProjectName] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [category, setCategory] = useState("");
  const [ownership, setOwnership] = useState("pandotic");
  const [clientName, setClientName] = useState("");
  const [domains, setDomains] = useState("");
  const [preset, setPreset] = useState<PresetKey | null>(null);

  // Check OAuth status on mount and handle OAuth callback
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/github/oauth/status");
        const data = await res.json();
        setGithubAuth(data);
        if (data.authenticated) {
          // Auto-load repos if authenticated via OAuth
          const reposRes = await fetch("/api/github/repos");
          const reposJson = await reposRes.json();
          if (reposJson.data) {
            setRepos(reposJson.data);
          }
        }
      } catch {
        // Auth check failed, user will need to manually auth or enter token
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();

    // Check for OAuth callback errors in URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("oauth_error");
      if (oauthError) {
        setError(`GitHub OAuth error: ${oauthError}`);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // Also support legacy localStorage token for backward compatibility
    const stored = typeof window !== "undefined" ? localStorage.getItem("gh_token") : null;
    if (stored && !githubAuth?.authenticated) setGhToken(stored);
  }, []);

  const selectedPlatform = PLATFORMS.find((p) => p.id === platform);
  const needsGithub = selectedPlatform?.needsGithub ?? false;

  // Auto-select preset based on first detected repo with a recommendation
  useEffect(() => {
    if (preset === null && selectedRepos.length > 0) {
      for (const repoName of selectedRepos) {
        const detected = detectedByRepo[repoName];
        if (detected?.recommendedPreset) {
          setPreset(detected.recommendedPreset as PresetKey);
          break;
        }
      }
    }
  }, [detectedByRepo, selectedRepos, preset]);

  async function loadRepos() {
    if (ghToken) {
      // Using legacy token input (backward compatibility)
      setLoadingRepos(true);
      setError(null);
      try {
        const res = await fetch(`/api/github/repos?token=${encodeURIComponent(ghToken)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }
        setRepos(json.data ?? []);
        if (typeof window !== "undefined") localStorage.setItem("gh_token", ghToken);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load GitHub repos");
      }
      setLoadingRepos(false);
    } else if (githubAuth?.authenticated) {
      // Already authenticated via OAuth, just fetch
      setLoadingRepos(true);
      setError(null);
      try {
        const res = await fetch("/api/github/repos");
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }
        setRepos(json.data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load GitHub repos");
      }
      setLoadingRepos(false);
    }
  }

  async function detectCms(repoFullName: string) {
    setDetectingRepos((prev) => new Set(prev).add(repoFullName));
    try {
      // Build query params based on available auth
      let url = `/api/github/detect?repo=${encodeURIComponent(repoFullName)}`;
      if (ghToken) {
        // Legacy token input
        url += `&token=${encodeURIComponent(ghToken)}`;
      }
      // Otherwise rely on OAuth cookie

      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setDetectedByRepo((prev) => ({ ...prev, [repoFullName]: json.data }));
      }
    } catch {
      // detection failed — non-critical
    }
    setDetectingRepos((prev) => {
      const next = new Set(prev);
      next.delete(repoFullName);
      return next;
    });
  }

  function toggleRepo(fullName: string) {
    setSelectedRepos((prev) => {
      if (prev.includes(fullName)) {
        return prev.filter((r) => r !== fullName);
      }
      if (!detectedByRepo[fullName] && !detectingRepos.has(fullName)) {
        detectCms(fullName);
      }
      return [...prev, fullName];
    });
  }

  function toggleSelectAllVisible() {
    const visibleNames = filteredRepos.map((r) => r.full_name);
    const allSelected = visibleNames.every((n) => selectedRepos.includes(n));
    if (allSelected) {
      setSelectedRepos((prev) => prev.filter((n) => !visibleNames.includes(n)));
    } else {
      const toAdd = visibleNames.filter((n) => !selectedRepos.includes(n));
      toAdd.forEach((n) => {
        if (!detectedByRepo[n] && !detectingRepos.has(n)) detectCms(n);
      });
      setSelectedRepos((prev) => Array.from(new Set([...prev, ...visibleNames])));
    }
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    const commonFields = {
      business_category: category || null,
      ownership_type: ownership,
      client_name: ownership === "client" ? clientName : null,
      domains: domains ? domains.split(",").map((d) => d.trim()).filter(Boolean) : [],
      status: "active",
      onboarding_status: "complete",
    };

    try {
      if (needsGithub) {
        // Multi-project creation from selected repos
        const reposToCreate = repos.filter((r) => selectedRepos.includes(r.full_name));
        if (reposToCreate.length === 0) {
          throw new Error("No repositories selected");
        }

        setCreateProgress({ done: 0, total: reposToCreate.length, current: "" });
        const failures: string[] = [];

        for (let i = 0; i < reposToCreate.length; i++) {
          const repo = reposToCreate[i];
          const detected = detectedByRepo[repo.full_name];
          const detectedType = detected?.detectedPlatform as PlatformType | undefined;
          const effectivePlatform: PlatformType =
            detectedType && detectedType !== "other" ? detectedType : (platform as PlatformType);

          setCreateProgress({ done: i, total: reposToCreate.length, current: repo.full_name });

          const res = await fetch("/api/properties", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: repo.name,
              slug: slugify(repo.name),
              url: repo.html_url,
              property_type: effectivePlatform === "mindpal" ? "app" : "site",
              platform_type: effectivePlatform,
              github_repo: repo.full_name,
              github_default_branch: repo.default_branch ?? "main",
              cms_installed: detected?.hasCms ?? false,
              enabled_modules: preset
                ? [...modulePresets[preset].modules]
                : (detected?.enabledModules ?? []),
              preset: preset ?? null,
              ...commonFields,
            }),
          });

          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            failures.push(`${repo.full_name}: ${json.error || `HTTP ${res.status}`}`);
          }
        }

        setCreateProgress({ done: reposToCreate.length, total: reposToCreate.length, current: "" });

        if (failures.length === reposToCreate.length) {
          throw new Error(`All projects failed to create:\n${failures.join("\n")}`);
        }
        if (failures.length > 0) {
          setError(`Created ${reposToCreate.length - failures.length} of ${reposToCreate.length}. Failures:\n${failures.join("\n")}`);
          setSaving(false);
          return;
        }
      } else {
        // Single manual project
        const name = projectName || manualName;
        const url = projectUrl || manualUrl;
        const res = await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            slug: slugify(name),
            url,
            property_type: platform === "mindpal" ? "app" : "site",
            platform_type: platform,
            github_repo: null,
            github_default_branch: "main",
            cms_installed: false,
            enabled_modules: preset ? [...modulePresets[preset].modules] : [],
            preset: preset ?? null,
            ...commonFields,
          }),
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || `HTTP ${res.status}`);
        }
      }

      router.push("/fleet?tab=business");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create project");
    }
    setSaving(false);
  }

  const filteredRepos = useMemo(
    () =>
      repos.filter((r) =>
        !repoSearch || r.full_name.toLowerCase().includes(repoSearch.toLowerCase())
      ),
    [repos, repoSearch]
  );

  const allVisibleSelected =
    filteredRepos.length > 0 && filteredRepos.every((r) => selectedRepos.includes(r.full_name));

  // ─── Step Validation ──────────────────────────────────────────────────

  const canAdvanceStep1 = !!platform;
  const canAdvanceStep2 = needsGithub ? selectedRepos.length > 0 : (!!manualName && !!manualUrl);
  const canSubmit = needsGithub ? selectedRepos.length > 0 : !!(projectName || manualName);

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
        <div className="mb-4 whitespace-pre-wrap rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
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
          <h2 className="text-lg font-medium text-white">Connect GitHub Repositories</h2>
          <p className="text-xs text-zinc-500">
            Select one or more repos to register as projects. Each will be created with the
            settings from the next step.
          </p>

          {checkingAuth ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking authentication…
            </div>
          ) : githubAuth?.authenticated ? (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {githubAuth.avatar_url && (
                    <img
                      src={githubAuth.avatar_url}
                      alt={githubAuth.login}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">
                      Logged in as {githubAuth.login}
                    </p>
                    {githubAuth.name && (
                      <p className="text-xs text-zinc-400">{githubAuth.name}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await fetch("/api/github/oauth/logout", { method: "POST" });
                    setGithubAuth({ authenticated: false });
                    setRepos([]);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Logout
                </button>
              </div>
              <button
                onClick={loadRepos}
                disabled={loadingRepos}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {loadingRepos ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
                Load Repositories
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <button
                  onClick={() => {
                    window.location.href = "/api/github/oauth/authorize";
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
                >
                  <Github className="h-4 w-4" />
                  Login with GitHub
                </button>
                <p className="mt-3 text-xs text-zinc-500">
                  Grant access to view your repositories. We only request read-only access to repos and user info.
                </p>
              </div>

              <details className="text-xs">
                <summary className="cursor-pointer text-zinc-500 hover:text-zinc-400">
                  Or use a GitHub token (legacy)
                </summary>
                <div className="mt-2 space-y-2 pt-2 border-t border-zinc-800">
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
                  <p className="text-zinc-600">
                    Missing repos? Fine-grained tokens only expose repositories you explicitly
                    selected when creating the token. For org repos, your token may also need SSO
                    authorization.
                  </p>
                </div>
              </details>
            </>
          )}

          {repos.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder="Search repos..."
                  className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
                />
                <button
                  onClick={toggleSelectAllVisible}
                  className="whitespace-nowrap rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  {allVisibleSelected ? "Clear all" : "Select all"}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {repos.length} repo{repos.length === 1 ? "" : "s"} loaded
                  {repoSearch ? ` · ${filteredRepos.length} match` : ""}
                </span>
                <span className="text-zinc-400">
                  {selectedRepos.length} selected
                </span>
              </div>

              <div className="max-h-80 space-y-1 overflow-y-auto rounded-lg border border-zinc-800 p-2">
                {filteredRepos.map((repo) => {
                  const isSelected = selectedRepos.includes(repo.full_name);
                  const detected = detectedByRepo[repo.full_name];
                  const isDetecting = detectingRepos.has(repo.full_name);
                  return (
                    <label
                      key={repo.full_name}
                      className={`flex w-full cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        isSelected ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRepo(repo.full_name)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{repo.full_name}</span>
                          {repo.private && (
                            <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500">
                              Private
                            </span>
                          )}
                          {repo.language && (
                            <span className="shrink-0 text-xs text-zinc-500">{repo.language}</span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="mt-0.5 truncate text-xs text-zinc-500">{repo.description}</p>
                        )}
                        {isSelected && (
                          <p className="mt-1 text-xs">
                            {isDetecting ? (
                              <span className="flex items-center gap-1 text-zinc-500">
                                <Loader2 className="h-3 w-3 animate-spin" /> Detecting CMS…
                              </span>
                            ) : detected ? (
                              detected.hasCms ? (
                                <span className="text-emerald-400">
                                  CMS v{detected.cmsVersion}
                                  {detected.enabledModules.length > 0
                                    ? ` · ${detected.enabledModules.length} modules`
                                    : ""}
                                </span>
                              ) : (
                                <span className="text-zinc-500">
                                  No CMS · {detected.detectedPlatform}
                                </span>
                              )
                            ) : null}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
                {filteredRepos.length === 0 && (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    No repos match "{repoSearch}"
                  </div>
                )}
              </div>
            </>
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
          <h2 className="text-lg font-medium text-white">
            {needsGithub && selectedRepos.length > 1
              ? `Configure ${selectedRepos.length} Projects`
              : "Configure Project"}
          </h2>
          {needsGithub && selectedRepos.length > 1 && (
            <p className="text-xs text-zinc-500">
              These settings will be applied to all selected projects. Project name and URL
              are derived from each repo.
            </p>
          )}

          {/* Single-project name/url — only shown for manual or single-repo flows */}
          {(!needsGithub || selectedRepos.length === 1) && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Project Name</label>
                <input
                  type="text"
                  value={
                    needsGithub
                      ? (repos.find((r) => r.full_name === selectedRepos[0])?.name ?? projectName)
                      : projectName
                  }
                  onChange={(e) => setProjectName(e.target.value)}
                  readOnly={needsGithub}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">URL</label>
                <input
                  type="text"
                  value={
                    needsGithub
                      ? (repos.find((r) => r.full_name === selectedRepos[0])?.html_url ?? projectUrl)
                      : projectUrl
                  }
                  onChange={(e) => setProjectUrl(e.target.value)}
                  readOnly={needsGithub}
                  placeholder="https://..."
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
                />
              </div>
            </div>
          )}

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
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              Domains (comma-separated, applied to every project)
            </label>
            <input
              type="text"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              placeholder="example.com, www.example.com"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
            />
            {needsGithub && selectedRepos.length > 1 && (
              <p className="mt-1 text-xs text-zinc-600">
                Leave blank if each project has its own domain — you can set them later.
              </p>
            )}
          </div>

          {/* Module preset picker (CMS-capable platforms only) */}
          {platform === "nextjs_supabase" && (
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                CMS Module Preset
                <span className="ml-2 font-normal text-zinc-600">
                  Optional — picks a default module set for new sites. Overrides any auto-detected modules.
                </span>
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPreset(null)}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                    preset === null
                      ? "border-violet-500 bg-violet-500/10 text-white"
                      : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  <div className="font-medium">None / use detected</div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    Leave modules empty (or use auto-detected from GitHub).
                  </div>
                </button>
                {PRESET_ORDER.map((key) => {
                  const p = modulePresets[key];
                  const active = preset === key;
                  const isRecommended = selectedRepos.length > 0 && selectedRepos.some((r) => detectedByRepo[r]?.recommendedPreset === key);
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setPreset(key)}
                      className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                        active
                          ? "border-violet-500 bg-violet-500/10 text-white"
                          : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{p.name}</span>
                        <div className="flex items-center gap-1">
                          {isRecommended && (
                            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-400 font-medium">
                              Suggested
                            </span>
                          )}
                          <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400">
                            {p.modules.length} modules
                          </span>
                        </div>
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                        {p.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="text-xs font-medium text-zinc-400">Summary</h3>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="text-zinc-500">Platform:</dt>
                <dd className="text-zinc-300">{selectedPlatform?.label}</dd>
              </div>
              {needsGithub ? (
                <div className="flex gap-2">
                  <dt className="text-zinc-500">
                    Repo{selectedRepos.length === 1 ? "" : "s"}:
                  </dt>
                  <dd className="flex-1 text-zinc-300">
                    {selectedRepos.length === 0 ? (
                      "—"
                    ) : selectedRepos.length === 1 ? (
                      selectedRepos[0]
                    ) : (
                      <ul className="space-y-0.5">
                        {selectedRepos.map((r) => (
                          <li key={r} className="truncate">• {r}</li>
                        ))}
                      </ul>
                    )}
                  </dd>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <dt className="text-zinc-500">Name:</dt>
                    <dd className="text-zinc-300">{projectName || "—"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-zinc-500">URL:</dt>
                    <dd className="text-zinc-300">{projectUrl || "—"}</dd>
                  </div>
                </>
              )}
              {platform === "nextjs_supabase" && preset && (
                <div className="flex gap-2">
                  <dt className="text-zinc-500">Preset:</dt>
                  <dd className="text-zinc-300">
                    {modulePresets[preset].name} ({modulePresets[preset].modules.length} modules)
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {createProgress && createProgress.total > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  Creating {createProgress.done} of {createProgress.total}
                  {createProgress.current ? ` · ${createProgress.current}` : ""}
                </span>
              </div>
            </div>
          )}
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
            {saving
              ? needsGithub && selectedRepos.length > 1
                ? `Creating ${selectedRepos.length}…`
                : "Creating…"
              : needsGithub && selectedRepos.length > 1
                ? `Create ${selectedRepos.length} Projects`
                : "Create Project"}
          </button>
        )}
      </div>
    </div>
  );
}
