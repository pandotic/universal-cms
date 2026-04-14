'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Deployment {
  id: string;
  skill_id: string;
  property_id: string;
  status: string;
  deployed_version: string;
  current_version: string;
  pinned: boolean;
  github_pr_url: string | null;
  github_repo: string | null;
  last_run_at: string | null;
  last_run_status: string | null;
  created_at: string;
  updated_at: string;
}

interface Run {
  id: string;
  status: string;
  triggered_by: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

interface SkillInfo {
  id: string;
  name: string;
  slug: string;
}

interface PropertyInfo {
  id: string;
  name: string;
  slug: string;
  url: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  pending: 'bg-amber-500/20 text-amber-400',
  paused: 'bg-zinc-500/20 text-zinc-400',
  failed: 'bg-red-500/20 text-red-400',
  removed: 'bg-zinc-800/50 text-zinc-600',
};

const runStatusColors: Record<string, string> = {
  completed: 'text-green-400',
  running: 'text-blue-400',
  pending: 'text-amber-400',
  failed: 'text-red-400',
  cancelled: 'text-zinc-500',
};

export default function DeploymentDetailPage() {
  const { id, depId } = useParams<{ id: string; depId: string }>();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [skill, setSkill] = useState<SkillInfo | null>(null);
  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinning, setPinning] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/skills/${id}/deployments/${depId}`);
      const json = await res.json();
      if (json.data) {
        setDeployment(json.data.deployment);
        setRuns(json.data.runs ?? []);
        setSkill(json.data.skill);
        setProperty(json.data.property);
      }
    } catch {
      // handled by empty state
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id, depId]);

  const togglePin = async () => {
    if (!deployment) return;
    setPinning(true);
    try {
      const res = await fetch(`/api/skills/${id}/deployments/${depId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: deployment.pinned ? 'unpin' : 'pin' }),
      });
      const json = await res.json();
      if (json.data) setDeployment(json.data);
    } catch {
      // silent
    }
    setPinning(false);
  };

  if (loading) {
    return <div className="py-12 text-center text-zinc-500">Loading deployment...</div>;
  }

  if (!deployment) {
    return (
      <div className="py-12 text-center text-zinc-500">
        Deployment not found.{' '}
        <Link href="/skills/matrix" className="underline hover:text-zinc-300">
          Back to Matrix
        </Link>
      </div>
    );
  }

  const isOutdated = deployment.deployed_version !== deployment.current_version;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="mb-1 flex flex-wrap items-center gap-1 text-sm text-zinc-500">
          <Link href="/skills" className="hover:text-zinc-300">
            Skill Library
          </Link>
          <span>/</span>
          {skill && (
            <>
              <Link href={`/skills/${skill.id}`} className="hover:text-zinc-300">
                {skill.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-zinc-300">
            {property?.name ?? 'Deployment'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Deployment Detail</h1>
      </div>

      {/* Status Header */}
      <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[deployment.status] ?? statusColors.pending
                }`}
              >
                {deployment.status}
              </span>
              {deployment.pinned && (
                <span className="inline-flex rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                  Pinned
                </span>
              )}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {skill?.name ?? 'Unknown Skill'}{' '}
              <span className="font-normal text-zinc-500">on</span>{' '}
              {property?.name ?? 'Unknown Property'}
            </h2>
            {property?.url && (
              <p className="mt-0.5 text-sm text-zinc-500">{property.url}</p>
            )}
          </div>
          <button
            onClick={togglePin}
            disabled={pinning}
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
          >
            {pinning ? '...' : deployment.pinned ? 'Unpin' : 'Pin Version'}
          </button>
        </div>
      </div>

      {/* Version Info */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium text-zinc-500">Deployed Version</p>
          <p className="mt-1 text-lg font-semibold text-white">
            v{deployment.deployed_version}
          </p>
        </div>
        <div
          className={`rounded-lg border p-4 ${
            isOutdated
              ? 'border-amber-800/50 bg-amber-900/10'
              : 'border-zinc-800 bg-zinc-900'
          }`}
        >
          <p className="text-xs font-medium text-zinc-500">Latest Version</p>
          <p
            className={`mt-1 text-lg font-semibold ${
              isOutdated ? 'text-amber-400' : 'text-white'
            }`}
          >
            v{deployment.current_version}
          </p>
          {isOutdated && (
            <p className="mt-1 text-xs text-amber-500">Update available</p>
          )}
        </div>
      </div>

      {/* GitHub PR */}
      {deployment.github_pr_url && (
        <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium text-zinc-500">GitHub PR</p>
          <a
            href={deployment.github_pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-blue-400 hover:text-blue-300 underline"
          >
            {deployment.github_pr_url}
          </a>
          {deployment.github_repo && (
            <p className="mt-1 text-xs text-zinc-500">
              Repo: {deployment.github_repo}
            </p>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-500">Created</p>
            <p className="text-zinc-300">
              {new Date(deployment.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-zinc-500">Last Updated</p>
            <p className="text-zinc-300">
              {new Date(deployment.updated_at).toLocaleDateString()}
            </p>
          </div>
          {deployment.last_run_at && (
            <div>
              <p className="text-zinc-500">Last Run</p>
              <p className="text-zinc-300">
                {new Date(deployment.last_run_at).toLocaleString()}
              </p>
            </div>
          )}
          {deployment.last_run_status && (
            <div>
              <p className="text-zinc-500">Last Run Status</p>
              <p className={runStatusColors[deployment.last_run_status] ?? 'text-zinc-300'}>
                {deployment.last_run_status}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Run History */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h3 className="text-sm font-medium text-white">Run History</h3>
        </div>
        {runs.length === 0 ? (
          <div className="p-6 text-center text-sm text-zinc-500">
            No runs recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {runs.map((run) => (
              <div key={run.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${
                      runStatusColors[run.status] ?? 'text-zinc-400'
                    }`}
                  >
                    {run.status}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {run.triggered_by}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400">
                    {run.started_at
                      ? new Date(run.started_at).toLocaleString()
                      : new Date(run.created_at).toLocaleString()}
                  </p>
                  {run.error_message && (
                    <p className="mt-0.5 max-w-xs truncate text-xs text-red-400">
                      {run.error_message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back link */}
      <div className="mt-6">
        <Link
          href="/skills/matrix"
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          &larr; Back to Fleet Matrix
        </Link>
      </div>
    </div>
  );
}
