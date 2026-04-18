'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Property {
  id: string;
  name: string;
  slug: string;
  url: string;
  relationship_type: string | null;
  site_profile: string | null;
  business_stage: string;
  auto_pilot_enabled: boolean;
  kill_switch: boolean;
  content_pending_review_count: number;
  agent_errors_24h_count: number;
  health_status: string;
}

interface BrandAssets {
  description_25: string | null;
  description_50: string | null;
  description_100: string | null;
  description_250: string | null;
  description_500: string | null;
  bio_twitter: string | null;
  bio_linkedin: string | null;
  bio_instagram: string | null;
  bio_facebook: string | null;
  category_primary: string | null;
  keywords: string[];
  press_boilerplate: string | null;
  nap_name: string | null;
  nap_address: string | null;
  nap_phone: string | null;
  nap_email: string | null;
}

interface SetupProgress {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  skipped: number;
  blocked: number;
  byCategory: Record<string, { total: number; completed: number }>;
}

interface SetupTask {
  id: string;
  category: string;
  task_name: string;
  platform: string | null;
  tier: string | null;
  status: string;
  execution_mode: string | null;
  result_url: string | null;
  completed_at: string | null;
}

type Tab = 'overview' | 'setup' | 'assets' | 'pipeline' | 'agents';

export default function BrandDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [assets, setAssets] = useState<BrandAssets | null>(null);
  const [setupProgress, setSetupProgress] = useState<SetupProgress | null>(null);
  const [setupTasks, setSetupTasks] = useState<SetupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/properties');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const found = json.data.find((p: Property) => p.slug === slug);
        if (!found) throw new Error('Brand not found');
        setProperty(found);

        const [assetsRes, progressRes, tasksRes] = await Promise.all([
          fetch(`/api/brand-assets?propertyId=${found.id}`),
          fetch(`/api/brand-setup?propertyId=${found.id}&view=progress`),
          fetch(`/api/brand-setup?propertyId=${found.id}`),
        ]);
        if (assetsRes.ok) {
          const a = await assetsRes.json();
          setAssets(a.data);
        }
        if (progressRes.ok) {
          const p = await progressRes.json();
          setSetupProgress(p.data);
        }
        if (tasksRes.ok) {
          const t = await tasksRes.json();
          setSetupTasks(t.data ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-medium text-red-400">{error || 'Brand not found'}</p>
        <Link href="/marketing-ops/brands" className="mt-2 inline-block text-sm text-zinc-400 hover:text-white">Back to Brands</Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'setup', label: `Setup${setupProgress ? ` (${setupProgress.completed}/${setupProgress.total})` : ''}` },
    { id: 'assets', label: 'Brand Assets' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'agents', label: 'Agents' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/marketing-ops/brands" className="text-sm text-zinc-500 hover:text-zinc-300">&larr; Brands</Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{property.name}</h1>
          {property.kill_switch && (
            <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">KILL SWITCH</span>
          )}
          {property.auto_pilot_enabled && (
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">AUTO-PILOT</span>
          )}
        </div>
        <div className="mt-1 flex gap-3 text-sm text-zinc-400">
          <a href={property.url} target="_blank" rel="noopener" className="hover:text-white">{property.url}</a>
          {property.relationship_type && (
            <span className="text-zinc-600">• {property.relationship_type.replace(/_/g, ' ')}</span>
          )}
          {property.site_profile && (
            <span className="text-zinc-600">• {property.site_profile.replace(/_/g, ' ')}</span>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-zinc-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm transition-colors ${activeTab === tab.id ? 'border-b-2 border-white text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab property={property} setupProgress={setupProgress} onPropertyUpdate={(updates) => setProperty(prev => prev ? { ...prev, ...updates } : prev)} />}
      {activeTab === 'setup' && <SetupTab tasks={setupTasks} progress={setupProgress} propertyId={property.id} relationshipType={property.relationship_type} onTasksChange={setSetupTasks} />}
      {activeTab === 'assets' && <AssetsTab assets={assets} />}
      {activeTab === 'pipeline' && <PipelineTab propertyId={property.id} />}
      {activeTab === 'agents' && <AgentsTab propertySlug={property.slug} />}
    </div>
  );
}

function OverviewTab({ property, setupProgress, onPropertyUpdate }: { property: Property; setupProgress: SetupProgress | null; onPropertyUpdate: (updates: Partial<Property>) => void }) {
  const [saving, setSaving] = useState(false);

  const updateField = async (field: string, value: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/properties`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: property.id, [field]: value }),
      });
      if (res.ok) onPropertyUpdate({ [field]: value } as any);
    } catch { /* silent */ }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card label="Health" value={property.health_status} />
        <Card label="Stage" value={property.business_stage} />
        <Card label="Pending Review" value={property.content_pending_review_count ?? 0} />
        <Card label="Agent Errors (24h)" value={property.agent_errors_24h_count ?? 0} />
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">Marketing Settings</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-zinc-500">Relationship Type</label>
            <select
              value={property.relationship_type ?? ''}
              onChange={e => updateField('relationship_type', e.target.value || null)}
              disabled={saving}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
            >
              <option value="">Not set</option>
              <option value="gbi_personal">GBI Personal</option>
              <option value="pandotic_studio">Pandotic Studio</option>
              <option value="pandotic_studio_product">Pandotic Studio Product</option>
              <option value="pandotic_client">Pandotic Client</option>
              <option value="standalone">Standalone</option>
              <option value="local_service">Local Service</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500">Site Profile</label>
            <select
              value={property.site_profile ?? ''}
              onChange={e => updateField('site_profile', e.target.value || null)}
              disabled={saving}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
            >
              <option value="">Not set</option>
              <option value="marketing_only">Marketing Only</option>
              <option value="marketing_and_cms">Marketing + CMS</option>
              <option value="app_only">App Only</option>
              <option value="local_service">Local Service</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-xs text-zinc-500">Auto-Pilot</label>
            <button
              onClick={() => updateField('auto_pilot_enabled', !property.auto_pilot_enabled)}
              disabled={saving}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${property.auto_pilot_enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}
            >
              {property.auto_pilot_enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-xs text-zinc-500">Kill Switch</label>
            <button
              onClick={() => updateField('kill_switch', !property.kill_switch)}
              disabled={saving}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${property.kill_switch ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-500'}`}
            >
              {property.kill_switch ? 'ACTIVE — All agents stopped' : 'Off'}
            </button>
          </div>
        </div>
      </div>

      {setupProgress && setupProgress.total > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-3 text-sm font-medium text-white">Setup Progress</h3>
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(setupProgress.completed / setupProgress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500">{setupProgress.completed} of {setupProgress.total} tasks completed</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {Object.entries(setupProgress.byCategory).map(([cat, data]) => (
              <span key={cat} className="text-xs text-zinc-400">
                {cat.replace(/_/g, ' ')}: {data.completed}/{data.total}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SetupTab({ tasks, progress, propertyId, relationshipType, onTasksChange }: { tasks: SetupTask[]; progress: SetupProgress | null; propertyId: string; relationshipType: string | null; onTasksChange: (tasks: SetupTask[]) => void }) {
  const [seeding, setSeeding] = useState(false);
  const categories = [...new Set(tasks.map(t => t.category))];

  const statusColors: Record<string, string> = {
    pending: 'text-zinc-500',
    in_progress: 'text-amber-400',
    completed: 'text-emerald-400',
    skipped: 'text-zinc-600',
    blocked: 'text-red-400',
  };

  const seedTasks = async () => {
    if (!relationshipType) return;
    setSeeding(true);
    try {
      const playbookRes = await fetch(`/api/brand-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed', property_id: propertyId, relationship_type: relationshipType }),
      });
      if (playbookRes.ok) {
        const listRes = await fetch(`/api/brand-setup?propertyId=${propertyId}`);
        if (listRes.ok) {
          const json = await listRes.json();
          onTasksChange(json.data ?? []);
        }
      }
    } catch { /* silent */ }
    setSeeding(false);
  };

  const markComplete = async (taskId: string) => {
    try {
      const res = await fetch('/api/brand-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', id: taskId }),
      });
      if (res.ok) {
        onTasksChange(tasks.map(t => t.id === taskId ? { ...t, status: 'completed', completed_at: new Date().toISOString() } : t));
      }
    } catch { /* silent */ }
  };

  const markStatus = async (taskId: string, status: string) => {
    try {
      const res = await fetch('/api/brand-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: taskId, updates: { status } }),
      });
      if (res.ok) {
        onTasksChange(tasks.map(t => t.id === taskId ? { ...t, status } : t));
      }
    } catch { /* silent */ }
  };

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
        <p className="text-zinc-400">No setup tasks yet.</p>
        {relationshipType ? (
          <button
            onClick={seedTasks}
            disabled={seeding}
            className="mt-3 rounded-lg border border-zinc-700 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {seeding ? 'Seeding...' : `Seed default tasks for ${relationshipType.replace(/_/g, ' ')}`}
          </button>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Set a relationship type on the Overview tab first, then seed default tasks.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map(cat => (
        <div key={cat}>
          <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-zinc-500">{cat.replace(/_/g, ' ')}</h3>
          <div className="divide-y divide-zinc-800/50 rounded-lg border border-zinc-800 bg-zinc-900">
            {tasks.filter(t => t.category === cat).map(task => (
              <div key={task.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => task.status !== 'completed' ? markComplete(task.id) : markStatus(task.id, 'pending')}
                    className={`text-sm ${statusColors[task.status] ?? 'text-zinc-400'} hover:text-white`}
                    title={task.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.status === 'completed' ? '✓' : task.status === 'blocked' ? '✗' : '○'}
                  </button>
                  <div>
                    <p className={`text-sm ${task.status === 'completed' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                      {task.task_name}
                    </p>
                    <div className="flex gap-2 text-xs text-zinc-600">
                      {task.platform && <span>{task.platform}</span>}
                      {task.tier && <span>• {task.tier.replace('_', ' ')}</span>}
                      {task.execution_mode && <span>• {task.execution_mode.replace('_', ' ')}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {task.status !== 'completed' && task.status !== 'skipped' && (
                    <button onClick={() => markStatus(task.id, 'skipped')} className="text-xs text-zinc-600 hover:text-zinc-400">
                      skip
                    </button>
                  )}
                  {task.result_url && (
                    <a href={task.result_url} target="_blank" rel="noopener" className="text-xs text-zinc-500 hover:text-white">
                      View &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AssetsTab({ assets }: { assets: BrandAssets | null }) {
  if (!assets) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
        <p className="text-zinc-400">No brand assets generated yet. Run the Brand Profile Builder agent to populate.</p>
      </div>
    );
  }

  const descriptions = [
    { label: '25 char', value: assets.description_25 },
    { label: '50 char', value: assets.description_50 },
    { label: '100 char', value: assets.description_100 },
    { label: '250 char', value: assets.description_250 },
    { label: '500 char', value: assets.description_500 },
  ].filter(d => d.value);

  const bios = [
    { label: 'Twitter', value: assets.bio_twitter },
    { label: 'LinkedIn', value: assets.bio_linkedin },
    { label: 'Instagram', value: assets.bio_instagram },
    { label: 'Facebook', value: assets.bio_facebook },
  ].filter(b => b.value);

  return (
    <div className="space-y-6">
      {descriptions.length > 0 && (
        <Section title="Descriptions">
          {descriptions.map(d => (
            <div key={d.label} className="flex gap-4 py-2">
              <span className="w-16 shrink-0 text-xs text-zinc-500">{d.label}</span>
              <p className="text-sm text-zinc-300">{d.value}</p>
            </div>
          ))}
        </Section>
      )}
      {bios.length > 0 && (
        <Section title="Social Bios">
          {bios.map(b => (
            <div key={b.label} className="py-2">
              <p className="text-xs text-zinc-500">{b.label}</p>
              <p className="mt-0.5 text-sm text-zinc-300">{b.value}</p>
            </div>
          ))}
        </Section>
      )}
      {assets.press_boilerplate && (
        <Section title="Press Boilerplate">
          <p className="text-sm text-zinc-300">{assets.press_boilerplate}</p>
        </Section>
      )}
      {(assets.nap_name || assets.nap_address || assets.nap_phone) && (
        <Section title="NAP (Name, Address, Phone)">
          {assets.nap_name && <p className="text-sm text-zinc-300">{assets.nap_name}</p>}
          {assets.nap_address && <p className="text-sm text-zinc-400">{assets.nap_address}</p>}
          {assets.nap_phone && <p className="text-sm text-zinc-400">{assets.nap_phone}</p>}
          {assets.nap_email && <p className="text-sm text-zinc-400">{assets.nap_email}</p>}
        </Section>
      )}
      {assets.keywords && assets.keywords.length > 0 && (
        <Section title="Keywords">
          <div className="flex flex-wrap gap-1.5">
            {assets.keywords.map(kw => (
              <span key={kw} className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{kw}</span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function PipelineTab({ propertyId }: { propertyId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/content-pipeline?propertyId=${propertyId}&limit=20`)
      .then(r => r.json())
      .then(j => setItems(j.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [propertyId]);

  if (loading) return <div className="py-8 text-center text-zinc-500">Loading...</div>;

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
        <p className="text-zinc-400">No content in the pipeline yet.</p>
        <Link href="/marketing-ops/pipeline" className="mt-2 inline-block text-sm text-zinc-500 hover:text-white">
          Go to Pipeline &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800/50 rounded-lg border border-zinc-800 bg-zinc-900">
      {items.map((item: any) => (
        <div key={item.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm text-zinc-200">{item.title || '(untitled)'}</p>
            <p className="text-xs text-zinc-500">{item.channel} • {item.status}{item.drafted_by_agent ? ` • by ${item.drafted_by_agent}` : ''}</p>
          </div>
          <span className="text-xs text-zinc-600">{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}

function AgentsTab({ propertySlug }: { propertySlug: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
      <p className="text-zinc-400">View and manage agents for this brand.</p>
      <Link href={`/properties/${propertySlug}/agents`} className="mt-2 inline-block text-sm text-zinc-500 hover:text-white">
        Go to Property Agents &rarr;
      </Link>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">{title}</h3>
      {children}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
