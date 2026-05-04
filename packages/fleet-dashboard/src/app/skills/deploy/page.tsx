'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface SkillEntry {
  id: string;
  name: string;
  slug: string;
  description: string;
  scope: string;
  version: string;
}

interface PropertyEntry {
  id: string;
  name: string;
  slug: string;
  url: string;
}

interface RepoEntry {
  full_name: string;
  name: string;
  owner: string;
  description: string | null;
  private: boolean;
  updated_at: string;
}

function DeploySkillsContent() {
  const searchParams = useSearchParams();
  const preselect = searchParams.get('preselect');

  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [properties, setProperties] = useState<PropertyEntry[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [selectedProperty, setSelectedProperty] = useState('');
  const [targetRepo, setTargetRepo] = useState('');
  const [ghToken, setGhToken] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<{ prUrl?: string; error?: string } | null>(null);
  const [step, setStep] = useState(1);

  // Repo browser state
  const [repos, setRepos] = useState<RepoEntry[]>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [searchResults, setSearchResults] = useState<RepoEntry[] | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [searchingRepos, setSearchingRepos] = useState(false);
  const [repoError, setRepoError] = useState('');
  const [showRepoBrowser, setShowRepoBrowser] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef(ghToken);

  useEffect(() => {
    tokenRef.current = ghToken;
  }, [ghToken]);

  // Debounced live search — fires when the user types 2+ chars and we have a token
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!repoSearch.trim() || repoSearch.length < 2) {
      setSearchResults(null);
      return;
    }
    const token = tokenRef.current;
    if (!token) return;
    searchTimer.current = setTimeout(async () => {
      setSearchingRepos(true);
      try {
        const res = await fetch(
          `/api/github/repos?token=${encodeURIComponent(token)}&search=${encodeURIComponent(repoSearch)}`
        );
        const json = await res.json();
        setSearchResults(res.ok ? (json.data ?? []) : null);
      } catch {
        setSearchResults(null);
      }
      setSearchingRepos(false);
    }, 350);
  }, [repoSearch]);

  useEffect(() => {
    const load = async () => {
      const [skillsRes, propsRes] = await Promise.all([
        fetch('/api/skills?scope=site'),
        fetch('/api/properties'),
      ]);
      const skillsJson = await skillsRes.json();
      const propsJson = await propsRes.json();
      const allSkills: SkillEntry[] = skillsJson.data ?? [];
      setSkills(allSkills);
      setProperties(propsJson.data ?? []);

      // Pre-select skills from query param
      if (preselect) {
        const ids = new Set(preselect.split(',').filter(Boolean));
        setSelectedSkills(ids);
        // If skills came from library they might not all be site-scoped; include any match
        if (ids.size > 0) {
          // Fetch all skills (not just site-scoped) to cover fleet skills too
          const allRes = await fetch('/api/skills');
          const allJson = await allRes.json();
          const allData: SkillEntry[] = allJson.data ?? [];
          const validIds = new Set(allData.map((s) => s.id));
          setSelectedSkills(new Set([...ids].filter((id) => validIds.has(id))));
        }
      }
    };
    load();

    const stored = localStorage.getItem('gh_token');
    if (stored) setGhToken(stored);
  }, [preselect]);

  const loadRepos = async () => {
    if (!ghToken) return;
    setLoadingRepos(true);
    setRepoError('');
    try {
      const res = await fetch(`/api/github/repos?token=${encodeURIComponent(ghToken)}`);
      const json = await res.json();
      if (!res.ok) {
        setRepoError(json.error ?? 'Failed to load repos');
        setRepos([]);
      } else {
        setRepos(json.data ?? []);
        setShowRepoBrowser(true);
      }
    } catch (e) {
      setRepoError(e instanceof Error ? e.message : 'Failed to load repos');
    }
    setLoadingRepos(false);
  };

  // Use live search results when available, otherwise filter local list
  const filteredRepos = searchResults !== null
    ? searchResults
    : repoSearch
    ? repos.filter(
        (r) =>
          r.full_name.toLowerCase().includes(repoSearch.toLowerCase()) ||
          (r.description ?? '').toLowerCase().includes(repoSearch.toLowerCase())
      )
    : repos;

  const toggleSkill = (id: string) => {
    const next = new Set(selectedSkills);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedSkills(next);
  };

  const deploy = async () => {
    if (!ghToken || !targetRepo || selectedSkills.size === 0 || !selectedProperty) return;
    setDeploying(true);
    setResult(null);

    try {
      const res = await fetch('/api/skills/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghToken,
          targetRepo,
          skillIds: Array.from(selectedSkills),
          propertyId: selectedProperty,
        }),
      });
      const json = await res.json();
      if (json.data?.prUrl) {
        setResult({ prUrl: json.data.prUrl });
      } else {
        setResult({ error: json.error || 'Deploy failed' });
      }
    } catch (err) {
      setResult({ error: String(err) });
    }
    setDeploying(false);
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-zinc-500">
        <Link href="/skills" className="hover:text-zinc-300">
          Skill Library
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">Deploy</span>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-white">Deploy Skills to Site</h1>
      <p className="mb-8 text-sm text-zinc-400">
        Select skills and a target repo to create a GitHub PR with the skill files.
      </p>

      {/* Steps */}
      <div className="mb-8 flex gap-2">
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              step === s
                ? 'bg-white text-zinc-900'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Step {s}:{' '}
            {s === 1 ? 'Select Skills' : s === 2 ? 'Target Repo' : 'Deploy'}
          </button>
        ))}
      </div>

      {/* Step 1: Select skills */}
      {step === 1 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Select Skills ({selectedSkills.size} selected)
            </h2>
            {skills.length > 0 && (
              <button
                onClick={() =>
                  selectedSkills.size === skills.length
                    ? setSelectedSkills(new Set())
                    : setSelectedSkills(new Set(skills.map((s) => s.id)))
                }
                className="text-sm text-zinc-400 hover:text-zinc-200"
              >
                {selectedSkills.size === skills.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {skills.map((skill) => (
              <label
                key={skill.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                  selectedSkills.has(skill.id)
                    ? 'border-blue-500/50 bg-zinc-800'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSkills.has(skill.id)}
                  onChange={() => toggleSkill(skill.id)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{skill.name}</div>
                  <div className="text-xs text-zinc-400">{skill.description}</div>
                </div>
                <span className="text-xs text-zinc-500">v{skill.version}</span>
              </label>
            ))}
          </div>
          {selectedSkills.size > 0 && (
            <button
              onClick={() => setStep(2)}
              className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
            >
              Next: Select Target →
            </button>
          )}
        </div>
      )}

      {/* Step 2: Target */}
      {step === 2 && (
        <div className="max-w-lg space-y-5">
          {/* GitHub Token */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              GitHub Token
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={ghToken}
                onChange={(e) => {
                  setGhToken(e.target.value);
                  localStorage.setItem('gh_token', e.target.value);
                  setRepos([]);
                  setShowRepoBrowser(false);
                }}
                placeholder="ghp_..."
                className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500"
              />
              <button
                onClick={loadRepos}
                disabled={!ghToken || loadingRepos}
                className="rounded-md bg-zinc-700 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-600 disabled:opacity-50 whitespace-nowrap"
              >
                {loadingRepos ? 'Loading...' : repos.length > 0 ? `${repos.length} repos` : 'Load Repos'}
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Needs <code>repo</code> scope. Stored in browser only.
            </p>
            {repoError && (
              <p className="mt-1 text-xs text-red-400">{repoError}</p>
            )}
          </div>

          {/* Repo picker */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Target Repository
            </label>

            {/* Manual input always visible */}
            <input
              type="text"
              value={targetRepo}
              onChange={(e) => { setTargetRepo(e.target.value); setShowRepoBrowser(false); }}
              placeholder="owner/repo-name"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500"
            />

            {/* Repo browser */}
            {repos.length > 0 && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowRepoBrowser((v) => !v)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                >
                  {showRepoBrowser ? 'Hide' : 'Browse'} {repos.length} accessible repos
                </button>

                {showRepoBrowser && (
                  <div className="mt-2 rounded-lg border border-zinc-700 bg-zinc-900">
                    <div className="border-b border-zinc-700 p-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={repoSearch}
                          onChange={(e) => setRepoSearch(e.target.value)}
                          placeholder="Search all accessible repos..."
                          className="w-full rounded bg-zinc-800 px-2 py-1.5 pr-8 text-sm text-white placeholder-zinc-500 focus:outline-none"
                          autoFocus
                        />
                        {searchingRepos && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">
                            searching…
                          </span>
                        )}
                      </div>
                      {repoSearch.length >= 2 && !searchingRepos && (
                        <p className="mt-1 text-[10px] text-zinc-600">
                          Searching GitHub across all accounts and orgs
                        </p>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredRepos.length === 0 && !searchingRepos && (
                        <div className="p-4 text-center text-xs text-zinc-500">
                          {repoSearch ? 'No repos match.' : 'No repos found.'}
                        </div>
                      )}
                      {filteredRepos.map((repo) => (
                        <button
                          key={repo.full_name}
                          type="button"
                          onClick={() => {
                            setTargetRepo(repo.full_name);
                            setShowRepoBrowser(false);
                          }}
                          className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-zinc-800 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white truncate">
                                {repo.full_name}
                              </span>
                              {repo.private && (
                                <span className="rounded bg-zinc-700 px-1 py-0.5 text-[10px] text-zinc-400 shrink-0">
                                  private
                                </span>
                              )}
                            </div>
                            {repo.description && (
                              <div className="mt-0.5 truncate text-xs text-zinc-500">
                                {repo.description}
                              </div>
                            )}
                          </div>
                          <span className="shrink-0 text-[10px] text-zinc-600">
                            {new Date(repo.updated_at).toLocaleDateString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Target property */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Target Property
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
            >
              <option value="">Select a property...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.url})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedProperty || !targetRepo || !ghToken}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
            >
              Next: Review & Deploy →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Deploy */}
      {step === 3 && (
        <div className="max-w-lg">
          <h2 className="mb-3 text-lg font-semibold text-white">Review</h2>
          <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-2">
            <div className="text-sm">
              <span className="text-zinc-400">Skills: </span>
              <span className="text-white">
                {skills
                  .filter((s) => selectedSkills.has(s.id))
                  .map((s) => s.name)
                  .join(', ')}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-zinc-400">Target repo: </span>
              <span className="text-white">{targetRepo}</span>
            </div>
            <div className="text-sm">
              <span className="text-zinc-400">Property: </span>
              <span className="text-white">
                {properties.find((p) => p.id === selectedProperty)?.name ?? selectedProperty}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white"
            >
              ← Back
            </button>
            <button
              onClick={deploy}
              disabled={deploying}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
            >
              {deploying ? 'Creating PR...' : 'Create Pull Request'}
            </button>
          </div>

          {result?.prUrl && (
            <div className="mt-4 rounded-lg border border-emerald-800 bg-emerald-900/20 p-4">
              <p className="mb-1 text-sm font-medium text-emerald-400">PR created successfully!</p>
              <a
                href={result.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:underline break-all"
              >
                {result.prUrl}
              </a>
            </div>
          )}

          {result?.error && (
            <div className="mt-4 rounded-lg border border-red-800 bg-red-900/20 p-4">
              <p className="text-sm text-red-400">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DeploySkillsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-zinc-500">Loading...</div>}>
      <DeploySkillsContent />
    </Suspense>
  );
}
