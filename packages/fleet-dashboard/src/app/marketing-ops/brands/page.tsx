'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Brand {
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

type StageFilter = 'active' | 'all' | 'parking_lot';

const relationshipColors: Record<string, string> = {
  gbi_personal: 'bg-blue-500/20 text-blue-400',
  pandotic_studio: 'bg-purple-500/20 text-purple-400',
  pandotic_studio_product: 'bg-violet-500/20 text-violet-400',
  pandotic_client: 'bg-amber-500/20 text-amber-400',
  standalone: 'bg-emerald-500/20 text-emerald-400',
  local_service: 'bg-orange-500/20 text-orange-400',
};

const healthColors: Record<string, string> = {
  healthy: 'text-emerald-400',
  degraded: 'text-amber-400',
  down: 'text-red-400',
  unknown: 'text-zinc-500',
};

export default function MarketingBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<StageFilter>('active');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/properties');
        const json = await res.json();
        setBrands(json.data ?? []);
      } catch {
        setBrands([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = brands.filter(b => {
    if (stageFilter === 'active' && b.business_stage !== 'active') return false;
    if (stageFilter === 'parking_lot' && b.business_stage !== 'maintenance') return false;
    if (typeFilter !== 'all' && b.relationship_type !== typeFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  const relationshipTypes = [...new Set(brands.map(b => b.relationship_type).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/marketing-ops" className="text-sm text-zinc-500 hover:text-zinc-300">&larr; Marketing Ops</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Brands</h1>
        <p className="mt-1 text-sm text-zinc-400">{brands.length} total brands, {brands.filter(b => b.business_stage === 'active').length} active</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
          {(['active', 'all', 'parking_lot'] as const).map(stage => (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${stageFilter === stage ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {stage === 'parking_lot' ? 'Parking Lot' : stage.charAt(0).toUpperCase() + stage.slice(1)}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300"
        >
          <option value="all">All types</option>
          {relationshipTypes.map(t => (
            <option key={t} value={t!}>{t!.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="pb-3 pr-4">Brand</th>
              <th className="pb-3 pr-4">Type</th>
              <th className="pb-3 pr-4">Profile</th>
              <th className="pb-3 pr-4">Health</th>
              <th className="pb-3 pr-4">Auto-Pilot</th>
              <th className="pb-3 pr-4">Pending</th>
              <th className="pb-3 pr-4">Errors</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filtered.map(brand => (
              <tr key={brand.id} className="hover:bg-zinc-900/50">
                <td className="py-3 pr-4">
                  <Link href={`/marketing-ops/brands/${brand.slug}`} className="font-medium text-white hover:text-zinc-300">
                    {brand.name}
                  </Link>
                  {brand.kill_switch && (
                    <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400">KILL</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {brand.relationship_type ? (
                    <span className={`rounded px-2 py-0.5 text-xs ${relationshipColors[brand.relationship_type] ?? 'bg-zinc-700 text-zinc-400'}`}>
                      {brand.relationship_type.replace(/_/g, ' ')}
                    </span>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-zinc-400">
                  {brand.site_profile ? brand.site_profile.replace(/_/g, ' ') : '—'}
                </td>
                <td className="py-3 pr-4">
                  <span className={healthColors[brand.health_status] ?? 'text-zinc-500'}>
                    {brand.health_status}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {brand.auto_pilot_enabled ? (
                    <span className="text-emerald-400">On</span>
                  ) : (
                    <span className="text-zinc-600">Off</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {(brand.content_pending_review_count ?? 0) > 0 ? (
                    <span className="text-amber-400">{brand.content_pending_review_count}</span>
                  ) : (
                    <span className="text-zinc-600">0</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {(brand.agent_errors_24h_count ?? 0) > 0 ? (
                    <span className="text-red-400">{brand.agent_errors_24h_count}</span>
                  ) : (
                    <span className="text-zinc-600">0</span>
                  )}
                </td>
                <td className="py-3 text-right">
                  <Link href={`/marketing-ops/brands/${brand.slug}`} className="text-zinc-500 hover:text-white">
                    View &rarr;
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-zinc-500">
                  No brands match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
