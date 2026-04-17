'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Property {
  id: string;
  name: string;
  slug: string;
}

interface AutoPilotSetting {
  property_id: string;
  content_type: string;
  auto_pilot_enabled: boolean;
  confidence_threshold: number;
  trust_score: number;
  max_per_day: number | null;
}

interface LearningEntry {
  id: string;
  property_id: string | null;
  check_type: string | null;
  outcome: string | null;
  human_feedback: string | null;
  created_at: string;
}

interface QAReview {
  id: string;
  content_id: string;
  content_table: string;
  reviewer_agent: string;
  overall_confidence: number | null;
  status: string | null;
  human_override: boolean;
  created_at: string;
}

const CONTENT_TYPES = ['social', 'blog', 'email', 'press', 'featured_pitch', 'newsletter', 'landing_page'];

const outcomeColors: Record<string, string> = {
  human_agreed: 'text-emerald-400',
  human_overrode: 'text-amber-400',
  false_positive: 'text-red-400',
  false_negative: 'text-red-400',
};

type Tab = 'overview' | 'autopilot' | 'learning';

export default function QADashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [autopilotSettings, setAutopilotSettings] = useState<AutoPilotSetting[]>([]);
  const [learnings, setLearnings] = useState<LearningEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await fetch('/api/properties');
        const json = await res.json();
        setProperties(json.data ?? []);
        if (json.data?.length > 0 && !selectedProperty) {
          const firstActive = json.data.find((p: any) => p.business_stage === 'active');
          setSelectedProperty(firstActive?.id ?? json.data[0].id);
        }
      } catch {
        setProperties([]);
      }
      setLoading(false);
    }
    loadProperties();
  }, []);

  useEffect(() => {
    if (!selectedProperty) return;
    async function loadBrandData() {
      try {
        const [apRes, lrRes] = await Promise.all([
          fetch(`/api/autopilot?propertyId=${selectedProperty}`),
          fetch(`/api/qa-learning?propertyId=${selectedProperty}&limit=25`),
        ]);
        const [apJson, lrJson] = await Promise.all([apRes.json(), lrRes.json()]);
        setAutopilotSettings(apJson.data ?? []);
        setLearnings(lrJson.data ?? []);
      } catch {
        setAutopilotSettings([]);
        setLearnings([]);
      }
    }
    loadBrandData();
  }, [selectedProperty]);

  const selectedPropertyObj = properties.find(p => p.id === selectedProperty);

  const updateAutopilot = async (contentType: string, updates: Partial<AutoPilotSetting>) => {
    if (!selectedProperty) return;
    const existing = autopilotSettings.find(s => s.content_type === contentType);
    const merged: AutoPilotSetting = {
      property_id: selectedProperty,
      content_type: contentType,
      auto_pilot_enabled: existing?.auto_pilot_enabled ?? false,
      confidence_threshold: existing?.confidence_threshold ?? 0.85,
      trust_score: existing?.trust_score ?? 0,
      max_per_day: existing?.max_per_day ?? null,
      ...updates,
    };
    try {
      const res = await fetch('/api/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      if (res.ok) {
        const json = await res.json();
        setAutopilotSettings(prev => {
          const filtered = prev.filter(s => s.content_type !== contentType);
          return [...filtered, json.data];
        });
      }
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  const overrideCount = learnings.filter(l => l.outcome === 'human_overrode').length;
  const agreeCount = learnings.filter(l => l.outcome === 'human_agreed').length;
  const agreementRate = learnings.length > 0 ? Math.round((agreeCount / learnings.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/marketing-ops" className="text-sm text-zinc-500 hover:text-zinc-300">&larr; Marketing Ops</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">QA & Reviews</h1>
        <p className="mt-1 text-sm text-zinc-400">Content quality assurance, auto-pilot settings, and learning log</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-zinc-400">Brand:</label>
        <select
          value={selectedProperty}
          onChange={e => setSelectedProperty(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300"
        >
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Auto-Pilot Enabled" value={autopilotSettings.filter(s => s.auto_pilot_enabled).length} />
        <StatCard label="Learning Entries" value={learnings.length} />
        <StatCard label="Agreement Rate" value={learnings.length > 0 ? `${agreementRate}%` : '—'} color="emerald" />
        <StatCard label="Overrides" value={overrideCount} color={overrideCount > 0 ? 'amber' : 'zinc'} />
      </div>

      <div className="flex gap-1 border-b border-zinc-800">
        {([
          { id: 'overview' as Tab, label: 'Overview' },
          { id: 'autopilot' as Tab, label: 'Auto-Pilot Settings' },
          { id: 'learning' as Tab, label: `Learning Log (${learnings.length})` },
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

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">How QA Works</h3>
            <div className="space-y-2 text-sm text-zinc-300">
              <p>1. <span className="text-zinc-100">Drafting agents</span> produce content and submit to the pipeline.</p>
              <p>2. <span className="text-zinc-100">Skeptical Reviewer</span> runs universal + type-specific QA checks and assigns a confidence score.</p>
              <p>3. Content with confidence &ge; threshold (default 0.85) and auto-pilot enabled can skip human review.</p>
              <p>4. Human overrides feed the <span className="text-zinc-100">learning log</span>, which tunes the reviewer over time.</p>
            </div>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm text-amber-400">
              <strong>Tip:</strong> Start with auto-pilot disabled for 2-3 weeks. Review the learning log, then enable auto-pilot for content types where the agreement rate is high.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'autopilot' && selectedPropertyObj && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            Per-content-type auto-pilot settings for <span className="text-zinc-200">{selectedPropertyObj.name}</span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="pb-3 pr-4">Content Type</th>
                  <th className="pb-3 pr-4">Enabled</th>
                  <th className="pb-3 pr-4">Confidence Threshold</th>
                  <th className="pb-3 pr-4">Max / Day</th>
                  <th className="pb-3">Trust Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {CONTENT_TYPES.map(ct => {
                  const s = autopilotSettings.find(st => st.content_type === ct);
                  return (
                    <tr key={ct} className="hover:bg-zinc-900/50">
                      <td className="py-3 pr-4 text-zinc-200">{ct.replace(/_/g, ' ')}</td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => updateAutopilot(ct, { auto_pilot_enabled: !(s?.auto_pilot_enabled ?? false) })}
                          className={`rounded px-3 py-1 text-xs transition-colors ${s?.auto_pilot_enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}
                        >
                          {s?.auto_pilot_enabled ? 'On' : 'Off'}
                        </button>
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="1"
                          defaultValue={s?.confidence_threshold ?? 0.85}
                          onBlur={e => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val !== (s?.confidence_threshold ?? 0.85)) {
                              updateAutopilot(ct, { confidence_threshold: val });
                            }
                          }}
                          className="w-20 rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-200"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          type="number"
                          min="0"
                          defaultValue={s?.max_per_day ?? ''}
                          placeholder="—"
                          onBlur={e => {
                            const val = e.target.value ? parseInt(e.target.value) : null;
                            if (val !== (s?.max_per_day ?? null)) {
                              updateAutopilot(ct, { max_per_day: val });
                            }
                          }}
                          className="w-20 rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-200"
                        />
                      </td>
                      <td className="py-3 text-xs text-zinc-500">
                        {s?.trust_score !== undefined ? s.trust_score.toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'learning' && (
        <div className="space-y-3">
          {learnings.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-zinc-400">No learning entries yet.</p>
              <p className="mt-1 text-sm text-zinc-500">Learnings are captured when humans agree with or override QA flags.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50 rounded-lg border border-zinc-800 bg-zinc-900">
              {learnings.map(entry => (
                <div key={entry.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${outcomeColors[entry.outcome ?? ''] ?? 'text-zinc-500'}`}>
                        {entry.outcome?.replace(/_/g, ' ') ?? '—'}
                      </span>
                      {entry.check_type && <span className="text-xs text-zinc-500">{entry.check_type}</span>}
                    </div>
                    <span className="text-xs text-zinc-600">{new Date(entry.created_at).toLocaleDateString()}</span>
                  </div>
                  {entry.human_feedback && (
                    <p className="mt-1 text-sm text-zinc-400">{entry.human_feedback}</p>
                  )}
                </div>
              ))}
            </div>
          )}
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
