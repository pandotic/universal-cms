'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface SkillDetail {
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
  execution_mode: string;
  default_schedule: string | null;
  manifest_id: string | null;
  content_path: string | null;
  component_ids: string[];
}

interface SkillVersion {
  id: string;
  version: string;
  changelog: string | null;
  content_hash: string;
  created_at: string;
}

interface Deployment {
  id: string;
  property_id: string;
  deployed_version: string;
  current_version: string;
  pinned: boolean;
  status: string;
  github_repo: string | null;
  github_pr_url: string | null;
}

export default function SkillDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [versions, setVersions] = useState<SkillVersion[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [skillRes, depsRes] = await Promise.all([
          fetch(`/api/skills/${id}`),
          fetch(`/api/skills/${id}/deployments`),
        ]);
        const skillJson = await skillRes.json();
        const depsJson = await depsRes.json();

        if (skillJson.data) {
          setSkill(skillJson.data.skill);
          setVersions(skillJson.data.versions ?? []);
        }
        setDeployments(depsJson.data ?? []);
      } catch {
        // handled by empty state
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return <div className="py-12 text-center text-zinc-500">Loading...</div>;
  }

  if (!skill) {
    return (
      <div className="py-12 text-center text-zinc-400">
        Skill not found.{' '}
        <Link href="/skills" className="text-blue-400 hover:underline">
          Back to library
        </Link>
      </div>
    );
  }

  const outdatedCount = deployments.filter(
    (d) => d.deployed_version !== d.current_version && !d.pinned
  ).length;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-zinc-500">
        <Link href="/skills" className="hover:text-zinc-300">
          Skill Library
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">{skill.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{skill.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">{skill.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              {skill.scope}
            </span>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              {skill.category.replace(/_/g, ' ')}
            </span>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              v{skill.version}
            </span>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              {skill.execution_mode}
            </span>
            {skill.default_schedule && (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                {skill.default_schedule}
              </span>
            )}
          </div>
        </div>
        {outdatedCount > 0 && (
          <span className="rounded-md bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-400">
            {outdatedCount} outdated deployment{outdatedCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deployments */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">
            Deployments ({deployments.length})
          </h2>
          {deployments.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-500">
              Not deployed to any properties yet.
            </div>
          ) : (
            <div className="space-y-2">
              {deployments.map((dep) => {
                const outdated = dep.deployed_version !== dep.current_version;
                return (
                  <div
                    key={dep.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            dep.status === 'active'
                              ? outdated && !dep.pinned
                                ? 'bg-amber-400'
                                : 'bg-green-400'
                              : dep.status === 'failed'
                                ? 'bg-red-400'
                                : 'bg-zinc-500'
                          }`}
                        />
                        <span className="text-sm font-medium text-zinc-200">
                          {dep.github_repo ?? dep.property_id.slice(0, 8)}
                        </span>
                        {dep.pinned && (
                          <span className="text-xs text-blue-400" title="Pinned">
                            pinned
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">
                        v{dep.deployed_version}
                        {outdated && !dep.pinned && (
                          <span className="ml-1 text-amber-400">
                            → v{dep.current_version}
                          </span>
                        )}
                      </span>
                    </div>
                    {dep.github_pr_url && (
                      <a
                        href={dep.github_pr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-xs text-blue-400 hover:underline"
                      >
                        View PR
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Version History */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">
            Version History ({versions.length})
          </h2>
          {versions.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-500">
              No version history. Sync the manifest to create version records.
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-200">
                      v{v.version}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {v.changelog && (
                    <p className="mt-1 text-xs text-zinc-400">{v.changelog}</p>
                  )}
                  <p className="mt-1 text-[10px] font-mono text-zinc-600">
                    {v.content_hash.slice(0, 16)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {skill.tags?.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-medium text-zinc-400">Tags / Triggers</h3>
          <div className="flex flex-wrap gap-1">
            {skill.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Components */}
      {skill.component_ids?.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-zinc-400">
            Bundled Components
          </h3>
          <div className="flex flex-wrap gap-1">
            {skill.component_ids.map((comp) => (
              <span
                key={comp}
                className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
              >
                {comp}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
