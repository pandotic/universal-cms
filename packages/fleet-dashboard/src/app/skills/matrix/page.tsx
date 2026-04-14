'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MatrixCell {
  deployment_id: string;
  skill_id: string;
  property_id: string;
  status: string;
  deployed_version: string;
  current_version: string;
  pinned: boolean;
  last_run_status: string | null;
}

interface SkillInfo {
  id: string;
  name: string;
  slug: string;
  scope: string;
}

interface PropertyInfo {
  id: string;
  name: string;
  slug: string;
  url: string;
  status: string;
}

export default function SkillsMatrixPage() {
  const [cells, setCells] = useState<MatrixCell[]>([]);
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [properties, setProperties] = useState<PropertyInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/skills/matrix');
        const json = await res.json();
        setCells(json.data?.cells ?? []);
        setSkills(json.data?.skills ?? []);
        setProperties(json.data?.properties ?? []);
      } catch {
        // empty state
      }
      setLoading(false);
    };
    load();
  }, []);

  const getCell = (propertyId: string, skillId: string): MatrixCell | undefined =>
    cells.find((c) => c.property_id === propertyId && c.skill_id === skillId);

  const getCellColor = (cell?: MatrixCell): string => {
    if (!cell) return 'bg-zinc-800/30';
    if (cell.status === 'failed') return 'bg-red-500/20';
    if (cell.pinned) return 'bg-blue-500/20';
    if (cell.deployed_version !== cell.current_version) return 'bg-amber-500/20';
    if (cell.status === 'active') return 'bg-green-500/20';
    return 'bg-zinc-700/30';
  };

  const getCellDot = (cell?: MatrixCell): string => {
    if (!cell) return '';
    if (cell.status === 'failed') return 'bg-red-400';
    if (cell.pinned) return 'bg-blue-400';
    if (cell.deployed_version !== cell.current_version) return 'bg-amber-400';
    if (cell.status === 'active') return 'bg-green-400';
    return 'bg-zinc-500';
  };

  if (loading) {
    return <div className="py-12 text-center text-zinc-500">Loading matrix...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-1 text-sm text-zinc-500">
            <Link href="/skills" className="hover:text-zinc-300">
              Skill Library
            </Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-300">Fleet Matrix</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Fleet Skills Matrix</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Properties as rows, skills as columns. Click a cell to manage the deployment.
          </p>
        </div>
        <Link
          href="/skills/deploy"
          className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
        >
          Deploy Skills
        </Link>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          Current
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          Update available
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
          Pinned
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          Failed
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-zinc-800/50" />
          Not deployed
        </div>
      </div>

      {/* Matrix */}
      {skills.length === 0 || properties.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center text-zinc-500">
          {skills.length === 0
            ? 'No site skills found. Sync the manifest first.'
            : 'No properties registered yet.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="sticky left-0 z-10 bg-zinc-900 px-4 py-3 text-left text-xs font-medium text-zinc-400">
                  Property
                </th>
                {skills.map((skill) => (
                  <th
                    key={skill.id}
                    className="px-3 py-3 text-center text-xs font-medium text-zinc-400"
                  >
                    <Link href={`/skills/${skill.id}`} className="hover:text-zinc-200">
                      {skill.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr
                  key={property.id}
                  className="border-b border-zinc-800/50 hover:bg-zinc-900/50"
                >
                  <td className="sticky left-0 z-10 bg-zinc-950 px-4 py-3">
                    <Link
                      href={`/properties/${property.slug}`}
                      className="text-sm font-medium text-zinc-200 hover:text-white"
                    >
                      {property.name}
                    </Link>
                    <div className="text-xs text-zinc-500">{property.url}</div>
                  </td>
                  {skills.map((skill) => {
                    const cell = getCell(property.id, skill.id);
                    return (
                      <td
                        key={skill.id}
                        className="px-3 py-3 text-center"
                      >
                        {cell ? (
                          <Link
                            href={`/skills/${skill.id}/deployments/${cell.deployment_id}`}
                            className={`mx-auto flex h-8 w-8 items-center justify-center rounded-md ${getCellColor(cell)} cursor-pointer hover:ring-1 hover:ring-zinc-600 transition-all`}
                            title={`v${cell.deployed_version}${cell.pinned ? ' (pinned)' : ''}${cell.deployed_version !== cell.current_version ? ` → v${cell.current_version}` : ''}`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${getCellDot(cell)}`}
                            />
                          </Link>
                        ) : (
                          <div
                            className={`mx-auto flex h-8 w-8 items-center justify-center rounded-md ${getCellColor(undefined)}`}
                            title="Not deployed"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
