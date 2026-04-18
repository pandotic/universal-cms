'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Opportunity {
  id: string;
  name: string;
  url: string;
  category: string | null;
  industry: string[];
  domain_authority: number | null;
  priority: string | null;
  submission_method: string | null;
  notes: string | null;
  created_at: string;
}

interface Submission {
  id: string;
  property_id: string;
  opportunity_id: string;
  status: string;
  submitted_url: string | null;
  submitted_at: string | null;
  is_live: boolean | null;
  created_at: string;
}

interface Property {
  id: string;
  name: string;
  slug: string;
}

const priorityColors: Record<string, string> = {
  tier_1: 'bg-red-500/20 text-red-400',
  tier_2: 'bg-amber-500/20 text-amber-400',
  tier_3: 'bg-zinc-700 text-zinc-400',
};

const statusColors: Record<string, string> = {
  queued: 'bg-zinc-700 text-zinc-300',
  submitted: 'bg-blue-500/20 text-blue-400',
  pending: 'bg-amber-500/20 text-amber-400',
  verified: 'bg-emerald-500/20 text-emerald-400',
  live: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
  failed: 'bg-red-500/20 text-red-400',
};

type Tab = 'opportunities' | 'submissions' | 'featured';

export default function LinkBuildingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('opportunities');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      try {
        const [oppRes, subRes, propRes] = await Promise.all([
          fetch('/api/link-building/opportunities'),
          fetch('/api/link-building/submissions?limit=100'),
          fetch('/api/properties'),
        ]);
        const [oppJson, subJson, propJson] = await Promise.all([oppRes.json(), subRes.json(), propRes.json()]);
        setOpportunities(oppJson.data ?? []);
        setSubmissions(subJson.data ?? []);
        setProperties(propJson.data ?? []);
      } catch {
        // silent
      }
      setLoading(false);
    }
    load();
  }, []);

  const filteredOpportunities = priorityFilter === 'all'
    ? opportunities
    : opportunities.filter(o => o.priority === priorityFilter);

  const liveLinks = submissions.filter(s => s.is_live === true).length;
  const pendingCount = submissions.filter(s => ['queued', 'submitted', 'pending'].includes(s.status)).length;

  const handleAddOpportunity = async (data: any) => {
    try {
      const res = await fetch('/api/link-building/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        setOpportunities([json.data, ...opportunities]);
        setShowAddForm(false);
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/marketing-ops" className="text-sm text-zinc-500 hover:text-zinc-300">&larr; Marketing Ops</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Link Building</h1>
        <p className="mt-1 text-sm text-zinc-400">Directory submissions, backlinks, and Featured.com across all brands</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Opportunities" value={opportunities.length} />
        <StatCard label="Total Submissions" value={submissions.length} />
        <StatCard label="Live Links" value={liveLinks} color="emerald" />
        <StatCard label="Pending" value={pendingCount} color={pendingCount > 0 ? 'amber' : 'zinc'} />
      </div>

      <div className="flex gap-1 border-b border-zinc-800">
        {([
          { id: 'opportunities' as Tab, label: `Opportunities (${opportunities.length})` },
          { id: 'submissions' as Tab, label: `Submissions (${submissions.length})` },
          { id: 'featured' as Tab, label: 'Featured.com' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm transition-colors ${activeTab === tab.id ? 'border-b-2 border-white text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        </div>
      ) : activeTab === 'opportunities' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300"
            >
              <option value="all">All priorities</option>
              <option value="tier_1">Tier 1 (Must-Have)</option>
              <option value="tier_2">Tier 2 (High Value)</option>
              <option value="tier_3">Tier 3 (Supporting)</option>
            </select>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="ml-auto rounded-lg border border-zinc-700 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
            >
              {showAddForm ? 'Cancel' : '+ Add Opportunity'}
            </button>
          </div>

          {showAddForm && (
            <AddOpportunityForm onSubmit={handleAddOpportunity} />
          )}

          {filteredOpportunities.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-zinc-400">No opportunities in the catalog yet.</p>
              <p className="mt-1 text-sm text-zinc-500">Add opportunities like G2, Crunchbase, LinkedIn, Product Hunt — then track per-brand submissions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Priority</th>
                    <th className="pb-3 pr-4">DA</th>
                    <th className="pb-3 pr-4">Submissions</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredOpportunities.map(opp => {
                    const oppSubs = submissions.filter(s => s.opportunity_id === opp.id);
                    return (
                      <tr key={opp.id} className="hover:bg-zinc-900/50">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-white">{opp.name}</p>
                          <a href={opp.url} target="_blank" rel="noopener" className="text-xs text-zinc-500 hover:text-zinc-300">
                            {opp.url}
                          </a>
                        </td>
                        <td className="py-3 pr-4 text-zinc-400">{opp.category || '—'}</td>
                        <td className="py-3 pr-4">
                          {opp.priority ? (
                            <span className={`rounded px-2 py-0.5 text-xs ${priorityColors[opp.priority]}`}>
                              {opp.priority.replace('_', ' ')}
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-zinc-400">{opp.domain_authority || '—'}</td>
                        <td className="py-3 pr-4">
                          <span className="text-zinc-400">{oppSubs.length}</span>
                          {oppSubs.filter(s => s.is_live).length > 0 && (
                            <span className="ml-2 text-xs text-emerald-400">{oppSubs.filter(s => s.is_live).length} live</span>
                          )}
                        </td>
                        <td className="py-3 text-right text-xs text-zinc-500">
                          <a href={opp.url} target="_blank" rel="noopener" className="hover:text-white">visit &rarr;</a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'submissions' ? (
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-zinc-400">No submissions tracked yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="pb-3 pr-4">Brand</th>
                    <th className="pb-3 pr-4">Opportunity</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Live</th>
                    <th className="pb-3 pr-4">Submitted</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {submissions.map(sub => {
                    const opp = opportunities.find(o => o.id === sub.opportunity_id);
                    const prop = properties.find(p => p.id === sub.property_id);
                    return (
                      <tr key={sub.id} className="hover:bg-zinc-900/50">
                        <td className="py-3 pr-4 text-zinc-200">{prop?.name ?? '—'}</td>
                        <td className="py-3 pr-4 text-zinc-200">{opp?.name ?? '—'}</td>
                        <td className="py-3 pr-4">
                          <span className={`rounded px-2 py-0.5 text-xs ${statusColors[sub.status] ?? 'bg-zinc-700 text-zinc-400'}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {sub.is_live === true ? <span className="text-emerald-400">✓</span> : sub.is_live === false ? <span className="text-red-400">✗</span> : <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="py-3 pr-4 text-xs text-zinc-500">
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 text-right text-xs">
                          {sub.submitted_url && (
                            <a href={sub.submitted_url} target="_blank" rel="noopener" className="text-zinc-500 hover:text-white">visit &rarr;</a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <FeaturedTab properties={properties} />
      )}
    </div>
  );
}

function AddOpportunityForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [da, setDa] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      url,
      category: category || null,
      priority: priority || null,
      domain_authority: da ? parseInt(da) : null,
      industry: [],
    });
    setName('');
    setUrl('');
    setCategory('');
    setPriority('');
    setDa('');
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name (e.g., G2, Crunchbase)"
          required
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600"
        />
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="URL"
          type="url"
          required
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600"
        />
        <input
          value={category}
          onChange={e => setCategory(e.target.value)}
          placeholder="Category (e.g., review_site, directory)"
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600"
        />
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300"
        >
          <option value="">Priority (optional)</option>
          <option value="tier_1">Tier 1 (Must-Have)</option>
          <option value="tier_2">Tier 2 (High Value)</option>
          <option value="tier_3">Tier 3 (Supporting)</option>
        </select>
        <input
          value={da}
          onChange={e => setDa(e.target.value)}
          placeholder="Domain Authority (0-100)"
          type="number"
          min="0"
          max="100"
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600"
        />
      </div>
      <button type="submit" className="rounded-lg border border-zinc-700 bg-white px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200">
        Add Opportunity
      </button>
    </form>
  );
}

function FeaturedTab({ properties }: { properties: Property[] }) {
  const [direction, setDirection] = useState<'outbound' | 'inbound'>('outbound');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/link-building/featured?direction=${direction}`)
      .then(r => r.json())
      .then(j => setItems(j.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [direction]);

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 w-fit">
        {(['outbound', 'inbound'] as const).map(d => (
          <button
            key={d}
            onClick={() => setDirection(d)}
            className={`rounded-md px-4 py-1.5 text-sm transition-colors ${direction === d ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            {d === 'outbound' ? 'Outbound Pitches' : 'Inbound Submissions'}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="py-8 text-center text-zinc-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-400">No {direction} {direction === 'outbound' ? 'pitches' : 'submissions'} yet.</p>
          <p className="mt-1 text-sm text-zinc-500">
            {direction === 'outbound' ? 'Track quote pitches submitted to Featured.com journalists.' : 'Track inbound contributor submissions (publisher mode).'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/50 rounded-lg border border-zinc-800 bg-zinc-900">
          {items.map((item: any) => {
            const prop = properties.find(p => p.id === item.property_id);
            return (
              <div key={item.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-200">
                    {direction === 'outbound' ? (item.question || '(no question)') : (item.pitch_summary || '(no summary)')}
                  </p>
                  <span className="text-xs text-zinc-500">{prop?.name ?? '—'}</span>
                </div>
                <div className="mt-1 flex gap-3 text-xs text-zinc-500">
                  {item.publication && <span>{item.publication}</span>}
                  {item.contributor_email && <span>{item.contributor_email}</span>}
                  {item.status && <span>• {item.status}</span>}
                </div>
                {item.published_url && (
                  <a href={item.published_url} target="_blank" rel="noopener" className="mt-1 inline-block text-xs text-emerald-400 hover:text-emerald-300">
                    Published &rarr;
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'zinc' }: { label: string; value: number | string; color?: string }) {
  const valueColor = color === 'amber' ? 'text-amber-400' : color === 'red' ? 'text-red-400' : color === 'emerald' ? 'text-emerald-400' : 'text-white';
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}
