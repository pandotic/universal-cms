'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SkillEntry {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  scope: string;
  platform: string;
  version: string;
  status: string;
  tags: string[];
  manifest_id: string | null;
}

type ScopeTab = 'all' | 'fleet' | 'site';

const categoryColors: Record<string, string> = {
  acquisition: 'bg-blue-500/20 text-blue-400',
  retention: 'bg-green-500/20 text-green-400',
  engagement: 'bg-purple-500/20 text-purple-400',
  analytics: 'bg-amber-500/20 text-amber-400',
  content_creation: 'bg-pink-500/20 text-pink-400',
  brand_management: 'bg-cyan-500/20 text-cyan-400',
  automation: 'bg-orange-500/20 text-orange-400',
  documents: 'bg-indigo-500/20 text-indigo-400',
  ai_automation: 'bg-violet-500/20 text-violet-400',
  developer_tools: 'bg-emerald-500/20 text-emerald-400',
  ui_components: 'bg-rose-500/20 text-rose-400',
  knowledge_base: 'bg-teal-500/20 text-teal-400',
};

const scopeColors: Record<string, string> = {
  fleet: 'bg-blue-500/20 text-blue-400',
  site: 'bg-green-500/20 text-green-400',
  both: 'bg-amber-500/20 text-amber-400',
};

type SyncStatus =
  | { kind: 'idle' }
  | { kind: 'success'; created: number; updated: number; unchanged: number }
  | { kind: 'error'; message: string };

type UpdateStatus =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'success'; updated: number; prs: string[] }
  | { kind: 'error'; message: string };

export default function SkillsPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ScopeTab>('all');
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ kind: 'idle' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ kind: 'idle' });
  const [ghToken, setGhToken] = useState('');
  const [showTokenPrompt, setShowTokenPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<'deploy' | 'update' | null>(null);

  const fetchSkills = async (scope?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (scope && scope !== 'all') params.set('scope', scope);
    if (search) params.set('search', search);

    try {
      const res = await fetch(`/api/skills?${params}`);
      const json = await res.json();
      setSkills(json.data ?? []);
    } catch {
      setSkills([]);
    }
    setLoading(false);
  };

  const syncManifest = async () => {
    setSyncing(true);
    setSyncStatus({ kind: 'idle' });
    try {
      const res = await fetch('/api/skills/sync', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSyncStatus({
          kind: 'error',
          message: json?.error ?? `Sync failed (HTTP ${res.status})`,
        });
      } else {
        const { created = 0, updated = 0, unchanged = 0 } = json?.data ?? {};
        setSyncStatus({ kind: 'success', created, updated, unchanged });
        await fetchSkills(activeTab);
      }
    } catch (e) {
      setSyncStatus({
        kind: 'error',
        message: e instanceof Error ? e.message : 'Sync failed',
      });
    }
    setSyncing(false);
  };

  useEffect(() => {
    fetchSkills(activeTab);
    const stored = localStorage.getItem('gh_token');
    if (stored) setGhToken(stored);
  }, [activeTab]);

  const filtered = search
    ? skills.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.description.toLowerCase().includes(search.toLowerCase())
      )
    : skills;

  const toggleSkill = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((s) => s.id)));
    }
  };

  const handleDeploy = () => {
    const ids = Array.from(selected).join(',');
    router.push(`/skills/deploy?preselect=${ids}`);
  };

  const handleUpdate = () => {
    if (!ghToken) {
      setPendingAction('update');
      setShowTokenPrompt(true);
      return;
    }
    runUpdate(ghToken);
  };

  const runUpdate = async (token: string) => {
    setUpdateStatus({ kind: 'running' });
    setShowTokenPrompt(false);
    try {
      const promises = Array.from(selected).map((skillId) =>
        fetch('/api/skills/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ghToken: token, skillId }),
        }).then((r) => r.json())
      );
      const results = await Promise.all(promises);
      const prs: string[] = results.flatMap((r) => r?.data?.prUrls ?? []);
      const updated = results.reduce((sum, r) => sum + (r?.data?.updated ?? 0), 0);
      setUpdateStatus({ kind: 'success', updated, prs });
    } catch (e) {
      setUpdateStatus({
        kind: 'error',
        message: e instanceof Error ? e.message : 'Update failed',
      });
    }
  };

  const tabs: { key: ScopeTab; label: string }[] = [
    { key: 'all', label: 'All Skills' },
    { key: 'fleet', label: 'Fleet Skills' },
    { key: 'site', label: 'Site Skills' },
  ];

  const allSelected = filtered.length > 0 && selected.size === filtered.length;
  const someSelected = selected.size > 0;

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Skill Library</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage and deploy skills across your fleet.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/skills/matrix"
            className="rounded-md bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            Fleet Matrix
          </Link>
          <Link
            href="/skills/upload"
            className="rounded-md bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            Upload Skill
          </Link>
          <button
            onClick={syncManifest}
            disabled={syncing}
            className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
          >
            {syncing ? 'Syncing...' : 'Sync Manifest'}
          </button>
        </div>
      </div>

      {/* Sync status */}
      {syncStatus.kind === 'success' && (
        <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Synced manifest — {syncStatus.created} created, {syncStatus.updated} updated, {syncStatus.unchanged} unchanged.
          {syncStatus.created === 0 && syncStatus.updated === 0 && syncStatus.unchanged === 0 && (
            <span className="ml-1 text-emerald-200/80">
              (Manifest was empty — check that <code>skills-manifest.json</code> is bundled with the deploy.)
            </span>
          )}
        </div>
      )}
      {syncStatus.kind === 'error' && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {syncStatus.message}
        </div>
      )}

      {/* Update status */}
      {updateStatus.kind === 'success' && (
        <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Updated {updateStatus.updated} deployment{updateStatus.updated !== 1 ? 's' : ''}.
          {updateStatus.prs.length > 0 && (
            <span className="ml-1">
              PRs:{' '}
              {updateStatus.prs.map((pr, i) => (
                <a key={i} href={pr} target="_blank" rel="noopener noreferrer" className="underline mr-2">{pr.split('/').pop()}</a>
              ))}
            </span>
          )}
        </div>
      )}
      {updateStatus.kind === 'error' && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {updateStatus.message}
        </div>
      )}

      {/* Token prompt modal */}
      {showTokenPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-6">
            <h3 className="mb-2 text-base font-semibold text-white">GitHub Token Required</h3>
            <p className="mb-4 text-sm text-zinc-400">
              A GitHub token with <code>repo</code> scope is needed to create update PRs.
            </p>
            <input
              type="password"
              value={ghToken}
              onChange={(e) => {
                setGhToken(e.target.value);
                localStorage.setItem('gh_token', e.target.value);
              }}
              placeholder="ghp_..."
              className="mb-4 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { if (ghToken) runUpdate(ghToken); }}
                disabled={!ghToken}
                className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
              >
                Continue
              </button>
              <button
                onClick={() => { setShowTokenPrompt(false); setPendingAction(null); }}
                className="rounded-md bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-zinc-900 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelected(new Set()); }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + select-all row */}
      <div className="mb-6 flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search skills..."
          className="flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
        />
        {!loading && filtered.length > 0 && (
          <button
            onClick={toggleAll}
            className="whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center text-zinc-500">Loading skills...</div>
      )}

      {/* Skills grid */}
      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((skill) => {
            const isSelected = selected.has(skill.id);
            return (
              <div key={skill.id} className="relative group">
                {/* Checkbox overlay */}
                <button
                  onClick={(e) => toggleSkill(skill.id, e)}
                  aria-label={isSelected ? 'Deselect skill' : 'Select skill'}
                  className={`absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded border transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500'
                      : someSelected
                      ? 'border-zinc-500 bg-zinc-800'
                      : 'border-zinc-700 bg-zinc-800 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {isSelected && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </button>

                <Link
                  href={`/skills/${skill.id}`}
                  className={`block rounded-lg border p-5 transition-colors ${
                    isSelected
                      ? 'border-blue-500/50 bg-zinc-800/80'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-2 pl-6">
                    <h3 className="font-semibold text-white">{skill.name}</h3>
                    <div className="flex shrink-0 gap-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          scopeColors[skill.scope] ?? 'bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        {skill.scope}
                      </span>
                    </div>
                  </div>

                  <p className="mb-4 text-sm text-zinc-400 line-clamp-2 pl-6">
                    {skill.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        categoryColors[skill.category] ?? 'bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      {skill.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-zinc-500">v{skill.version}</span>
                  </div>

                  {skill.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {skill.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-zinc-800/50 px-1.5 py-0.5 text-[10px] text-zinc-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-zinc-400">
            {search ? 'No skills match your search.' : 'No skills found. Click "Sync Manifest" to import from the skill library.'}
          </p>
        </div>
      )}

      {/* Sticky action bar */}
      {someSelected && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-700/60 bg-zinc-900/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-white">
                {selected.size} skill{selected.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelected(new Set())}
                className="text-sm text-zinc-400 hover:text-zinc-200"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpdate}
                disabled={updateStatus.kind === 'running'}
                className="rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
              >
                {updateStatus.kind === 'running' ? 'Updating...' : 'Update Fleet Deployments'}
              </button>
              <button
                onClick={handleDeploy}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
              >
                Deploy to Site →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
