'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BrandSummary {
  id: string;
  name: string;
  slug: string;
  relationship_type: string | null;
  business_stage: string;
  auto_pilot_enabled: boolean;
  kill_switch: boolean;
  content_pending_review_count: number;
  agent_errors_24h_count: number;
}

const relationshipColors: Record<string, string> = {
  gbi_personal: 'bg-blue-500/20 text-blue-400',
  pandotic_studio: 'bg-purple-500/20 text-purple-400',
  pandotic_studio_product: 'bg-violet-500/20 text-violet-400',
  pandotic_client: 'bg-amber-500/20 text-amber-400',
  standalone: 'bg-emerald-500/20 text-emerald-400',
  local_service: 'bg-orange-500/20 text-orange-400',
};

export default function MarketingOpsPage() {
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  const activeBrands = brands.filter(b => b.business_stage === 'active');
  const pendingReview = brands.reduce((sum, b) => sum + (b.content_pending_review_count ?? 0), 0);
  const agentErrors = brands.reduce((sum, b) => sum + (b.agent_errors_24h_count ?? 0), 0);
  const autoPilotCount = brands.filter(b => b.auto_pilot_enabled).length;
  const killSwitchCount = brands.filter(b => b.kill_switch).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Marketing Operations</h1>
        <p className="mt-1 text-sm text-zinc-400">Virtual marketing department across {activeBrands.length} active brands</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active Brands" value={activeBrands.length} />
        <StatCard label="Pending Review" value={pendingReview} color={pendingReview > 0 ? 'amber' : 'zinc'} />
        <StatCard label="Agent Errors (24h)" value={agentErrors} color={agentErrors > 0 ? 'red' : 'zinc'} />
        <StatCard label="Auto-Pilot" value={`${autoPilotCount} / ${activeBrands.length}`} />
      </div>

      {killSwitchCount > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-400">
            {killSwitchCount} brand{killSwitchCount > 1 ? 's' : ''} with kill switch active
          </p>
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Brands</h2>
          <Link href="/marketing-ops/brands" className="text-sm text-zinc-400 hover:text-white">
            View all &rarr;
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activeBrands.map(brand => (
            <Link
              key={brand.id}
              href={`/marketing-ops/brands/${brand.slug}`}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{brand.name}</span>
                {brand.kill_switch && (
                  <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400">STOPPED</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {brand.relationship_type && (
                  <span className={`rounded px-2 py-0.5 text-xs ${relationshipColors[brand.relationship_type] ?? 'bg-zinc-700 text-zinc-400'}`}>
                    {brand.relationship_type.replace(/_/g, ' ')}
                  </span>
                )}
                {brand.auto_pilot_enabled && (
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">auto-pilot</span>
                )}
              </div>
              <div className="mt-3 flex gap-4 text-xs text-zinc-500">
                <span>{brand.content_pending_review_count ?? 0} pending</span>
                {(brand.agent_errors_24h_count ?? 0) > 0 && (
                  <span className="text-red-400">{brand.agent_errors_24h_count} errors</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink href="/marketing-ops/pipeline" label="Content Pipeline" desc="Review and approve content across all brands" />
        <QuickLink href="/marketing-ops/link-building" label="Link Building" desc="Track directory submissions and backlinks" />
        <QuickLink href="/marketing-ops/qa" label="QA & Reviews" desc="Quality assurance dashboard and learning log" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'zinc' }: { label: string; value: number | string; color?: string }) {
  const valueColor = color === 'amber' ? 'text-amber-400' : color === 'red' ? 'text-red-400' : 'text-white';
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700">
      <p className="font-medium text-white">{label}</p>
      <p className="mt-1 text-sm text-zinc-400">{desc}</p>
    </Link>
  );
}
