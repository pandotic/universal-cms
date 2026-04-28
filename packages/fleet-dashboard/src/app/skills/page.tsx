'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ScopeTab>('all');
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ kind: 'idle' });

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
  }, [activeTab]);

  const filtered = search
    ? skills.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.description.toLowerCase().includes(search.toLowerCase())
      )
    : skills;

  const tabs: { key: ScopeTab; label: string; description: string }[] = [
    { key: 'all', label: 'All Skills', description: 'All registered skills' },
    { key: 'fleet', label: 'Fleet Skills', description: 'Marketing skills run from the hub' },
    { key: 'site', label: 'Site Skills', description: 'Implementation skills deployed to repos' },
  ];

  return (
    <div>
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
          <Link
            href="/skills/deploy"
            className="rounded-md bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            Deploy Skills
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

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-zinc-900 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
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

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search skills..."
          className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center text-zinc-500">Loading skills...</div>
      )}

      {/* Skills grid */}
      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((skill) => (
            <Link
              key={skill.id}
              href={`/skills/${skill.id}`}
              className="block rounded-lg border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
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

              <p className="mb-4 text-sm text-zinc-400 line-clamp-2">
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
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-zinc-400">
            {search ? 'No skills match your search.' : 'No skills found. Click "Sync Manifest" to import from the skill library.'}
          </p>
        </div>
      )}
    </div>
  );
}
