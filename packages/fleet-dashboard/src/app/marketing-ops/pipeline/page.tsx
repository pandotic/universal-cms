'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PipelineItem {
  id: string;
  property_id: string;
  channel: string;
  title: string | null;
  body: string;
  status: string;
  platform: string | null;
  drafted_by_agent: string | null;
  qa_confidence: number | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-zinc-700 text-zinc-300',
  drafted: 'bg-zinc-700 text-zinc-300',
  qa_review: 'bg-blue-500/20 text-blue-400',
  review: 'bg-blue-500/20 text-blue-400',
  needs_human_review: 'bg-amber-500/20 text-amber-400',
  revision_requested: 'bg-orange-500/20 text-orange-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  scheduled: 'bg-purple-500/20 text-purple-400',
  published: 'bg-emerald-500/20 text-emerald-400',
  archived: 'bg-zinc-800 text-zinc-500',
};

const channelColors: Record<string, string> = {
  social: 'bg-blue-500/20 text-blue-400',
  blog: 'bg-green-500/20 text-green-400',
  email: 'bg-amber-500/20 text-amber-400',
  press: 'bg-purple-500/20 text-purple-400',
  featured_pitch: 'bg-pink-500/20 text-pink-400',
  newsletter: 'bg-cyan-500/20 text-cyan-400',
};

export default function PipelinePage() {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (channelFilter !== 'all') params.set('channel', channelFilter);

      try {
        const res = await fetch(`/api/content-pipeline?${params}`);
        const json = await res.json();
        setItems(json.data ?? []);
      } catch {
        setItems([]);
      }
      setLoading(false);
    }
    load();
  }, [statusFilter, channelFilter]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/marketing-ops" className="text-sm text-zinc-500 hover:text-zinc-300">&larr; Marketing Ops</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Content Pipeline</h1>
        <p className="mt-1 text-sm text-zinc-400">All content across brands flowing through the pipeline</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setLoading(true); }}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300"
        >
          <option value="all">All statuses</option>
          <option value="needs_human_review">Needs Review</option>
          <option value="drafted">Drafted</option>
          <option value="qa_review">QA Review</option>
          <option value="approved">Approved</option>
          <option value="published">Published</option>
        </select>
        <select
          value={channelFilter}
          onChange={e => { setChannelFilter(e.target.value); setLoading(true); }}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300"
        >
          <option value="all">All channels</option>
          <option value="social">Social</option>
          <option value="blog">Blog</option>
          <option value="email">Email</option>
          <option value="press">Press</option>
          <option value="newsletter">Newsletter</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-400">No content in the pipeline yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/50 rounded-lg border border-zinc-800 bg-zinc-900">
          {items.map(item => (
            <Link
              key={item.id}
              href={`/marketing-ops/pipeline/${item.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-zinc-800/30"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-200">{item.title || item.body.slice(0, 80)}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className={`rounded px-2 py-0.5 text-xs ${channelColors[item.channel] ?? 'bg-zinc-700 text-zinc-400'}`}>
                    {item.channel}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-xs ${statusColors[item.status] ?? 'bg-zinc-700 text-zinc-400'}`}>
                    {item.status.replace(/_/g, ' ')}
                  </span>
                  {item.platform && <span className="text-xs text-zinc-600">{item.platform}</span>}
                  {item.drafted_by_agent && <span className="text-xs text-zinc-600">by {item.drafted_by_agent}</span>}
                </div>
              </div>
              <div className="ml-4 shrink-0 text-right">
                {item.qa_confidence !== null && (
                  <p className="text-xs text-zinc-500">{Math.round(item.qa_confidence * 100)}% confidence</p>
                )}
                <p className="text-xs text-zinc-600">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
