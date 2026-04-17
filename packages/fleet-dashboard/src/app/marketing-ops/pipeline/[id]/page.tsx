'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface PipelineItem {
  id: string;
  property_id: string;
  brief_id: string | null;
  channel: string;
  platform: string | null;
  content_type: string | null;
  title: string | null;
  body: string;
  excerpt: string | null;
  media_urls: string[];
  hashtags: string[];
  status: string;
  drafted_by_agent: string | null;
  qa_confidence: number | null;
  published_url: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface QAReview {
  id: string;
  reviewer_agent: string;
  overall_confidence: number | null;
  status: string | null;
  checks: Record<string, unknown> | null;
  suggested_fixes: string[];
  human_override: boolean;
  override_reason: string | null;
  created_at: string;
}

interface Property {
  id: string;
  name: string;
  slug: string;
}

const PIPELINE_STATUSES = [
  'drafted',
  'qa_review',
  'needs_human_review',
  'revision_requested',
  'approved',
  'scheduled',
  'published',
  'archived',
];

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

export default function ContentPipelineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<PipelineItem | null>(null);
  const [reviews, setReviews] = useState<QAReview[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [editedBody, setEditedBody] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/content-pipeline/${id}`);
        if (!res.ok) throw new Error('Not found');
        const json = await res.json();
        const data: PipelineItem = json.data;
        setItem(data);
        setEditedBody(data.body);
        setEditedTitle(data.title ?? '');

        const [qaRes, propRes] = await Promise.all([
          fetch(`/api/qa-reviews?contentId=${id}&contentTable=hub_content_pipeline`),
          fetch('/api/properties'),
        ]);
        if (qaRes.ok) {
          const qaJson = await qaRes.json();
          setReviews(qaJson.data ?? []);
        }
        if (propRes.ok) {
          const propJson = await propRes.json();
          const found = propJson.data?.find((p: Property) => p.id === data.property_id);
          setProperty(found ?? null);
        }
      } catch {
        setItem(null);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const transition = async (newStatus: string) => {
    if (!item) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/content-pipeline/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'transition', status: newStatus }),
      });
      if (res.ok) {
        const json = await res.json();
        setItem(json.data);
      }
    } catch {
      // silent
    }
    setSaving(false);
  };

  const saveEdits = async () => {
    if (!item) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/content-pipeline/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: editedBody,
          title: editedTitle || null,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setItem(json.data);
      }
    } catch {
      // silent
    }
    setSaving(false);
  };

  const requestRevision = async () => {
    if (!item || !revisionNote.trim()) return;
    setSaving(true);
    try {
      const existingMeta = (item as any).metadata ?? {};
      const revisions = Array.isArray(existingMeta.revision_requests) ? existingMeta.revision_requests : [];
      const res = await fetch(`/api/content-pipeline/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'revision_requested',
          metadata: {
            ...existingMeta,
            revision_requests: [
              ...revisions,
              { note: revisionNote, requested_at: new Date().toISOString() },
            ],
          },
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setItem(json.data);
        setRevisionNote('');
      }
    } catch {
      // silent
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-medium text-red-400">Content item not found</p>
        <Link href="/marketing-ops/pipeline" className="mt-2 inline-block text-sm text-zinc-400 hover:text-white">Back to Pipeline</Link>
      </div>
    );
  }

  const latestReview = reviews[0];
  const hasEdits = editedBody !== item.body || editedTitle !== (item.title ?? '');
  const metadata = (item as any).metadata ?? {};
  const revisionRequests = Array.isArray(metadata.revision_requests) ? metadata.revision_requests : [];

  return (
    <div className="space-y-4">
      <div>
        <Link href="/marketing-ops/pipeline" className="text-sm text-zinc-500 hover:text-zinc-300">&larr; Pipeline</Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {item.title || <span className="text-zinc-500">(untitled)</span>}
            </h1>
            <div className="mt-1 flex flex-wrap gap-2 text-sm">
              {property && (
                <Link href={`/marketing-ops/brands/${property.slug}`} className="text-zinc-400 hover:text-white">
                  {property.name}
                </Link>
              )}
              <span className={`rounded px-2 py-0.5 text-xs ${statusColors[item.status] ?? 'bg-zinc-700 text-zinc-400'}`}>
                {item.status.replace(/_/g, ' ')}
              </span>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{item.channel}</span>
              {item.platform && <span className="text-xs text-zinc-500">• {item.platform}</span>}
              {item.drafted_by_agent && <span className="text-xs text-zinc-500">• drafted by {item.drafted_by_agent}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Content</h3>
            {hasEdits && (
              <button
                onClick={saveEdits}
                disabled={saving}
                className="rounded border border-zinc-700 bg-white px-3 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save edits'}
              </button>
            )}
          </div>
          <input
            value={editedTitle}
            onChange={e => setEditedTitle(e.target.value)}
            placeholder="Title (optional)"
            className="mb-3 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
          />
          <textarea
            value={editedBody}
            onChange={e => setEditedBody(e.target.value)}
            rows={18}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 font-mono"
          />
          {item.hashtags && item.hashtags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.hashtags.map(tag => (
                <span key={tag} className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">QA Review</h3>
            {latestReview ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-500">Reviewer</p>
                  <p className="text-sm text-zinc-200">{latestReview.reviewer_agent}</p>
                </div>
                {latestReview.overall_confidence !== null && (
                  <div>
                    <p className="text-xs text-zinc-500">Confidence</p>
                    <p className="text-sm text-zinc-200">{Math.round(latestReview.overall_confidence * 100)}%</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full ${latestReview.overall_confidence >= 0.85 ? 'bg-emerald-500' : latestReview.overall_confidence >= 0.6 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${latestReview.overall_confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {latestReview.suggested_fixes && latestReview.suggested_fixes.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500">Suggested fixes</p>
                    <ul className="mt-1 space-y-1 text-sm text-zinc-300">
                      {latestReview.suggested_fixes.map((fix, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-amber-400">•</span>
                          <span>{fix}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No QA review yet.</p>
            )}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {PIPELINE_STATUSES.filter(s => s !== item.status).map(s => (
                <button
                  key={s}
                  onClick={() => transition(s)}
                  disabled={saving}
                  className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
                >
                  &rarr; {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">Request Revision</h3>
            <textarea
              value={revisionNote}
              onChange={e => setRevisionNote(e.target.value)}
              placeholder="Describe what should be revised (e.g., 'too corporate — make it more warm')"
              rows={4}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
            />
            <button
              onClick={requestRevision}
              disabled={!revisionNote.trim() || saving}
              className="mt-2 rounded border border-zinc-700 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
            >
              Request revision
            </button>
            {revisionRequests.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-zinc-500">Previous revision requests</p>
                {revisionRequests.map((rev: any, i: number) => (
                  <div key={i} className="rounded bg-zinc-800/50 p-2 text-xs text-zinc-400">
                    {rev.note}
                    <span className="ml-2 text-zinc-600">
                      {rev.requested_at ? new Date(rev.requested_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">Metadata</h3>
        <div className="grid gap-3 sm:grid-cols-4 text-xs">
          <div>
            <p className="text-zinc-500">Created</p>
            <p className="text-zinc-300">{new Date(item.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-zinc-500">Updated</p>
            <p className="text-zinc-300">{new Date(item.updated_at).toLocaleString()}</p>
          </div>
          {item.scheduled_for && (
            <div>
              <p className="text-zinc-500">Scheduled for</p>
              <p className="text-zinc-300">{new Date(item.scheduled_for).toLocaleString()}</p>
            </div>
          )}
          {item.published_at && (
            <div>
              <p className="text-zinc-500">Published</p>
              <p className="text-zinc-300">{new Date(item.published_at).toLocaleString()}</p>
            </div>
          )}
          {item.published_url && (
            <div className="sm:col-span-2">
              <p className="text-zinc-500">Published URL</p>
              <a href={item.published_url} target="_blank" rel="noopener" className="text-zinc-300 hover:text-white break-all">
                {item.published_url}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
