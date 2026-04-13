'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SkillEntry {
  id: string;
  name: string;
  slug: string;
  description: string;
  scope: string;
  version: string;
}

interface PropertyEntry {
  id: string;
  name: string;
  slug: string;
  url: string;
}

export default function DeploySkillsPage() {
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [properties, setProperties] = useState<PropertyEntry[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [selectedProperty, setSelectedProperty] = useState('');
  const [targetRepo, setTargetRepo] = useState('');
  const [ghToken, setGhToken] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<{ prUrl?: string; error?: string } | null>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const load = async () => {
      const [skillsRes, propsRes] = await Promise.all([
        fetch('/api/skills?scope=site'),
        fetch('/api/properties'),
      ]);
      const skillsJson = await skillsRes.json();
      const propsJson = await propsRes.json();
      setSkills(skillsJson.data ?? []);
      setProperties(propsJson.data ?? []);
    };
    load();

    // Check for stored GitHub token
    const stored = localStorage.getItem('gh_token');
    if (stored) setGhToken(stored);
  }, []);

  const toggleSkill = (id: string) => {
    const next = new Set(selectedSkills);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedSkills(next);
  };

  const deploy = async () => {
    if (!ghToken || !targetRepo || selectedSkills.size === 0 || !selectedProperty) return;
    setDeploying(true);
    setResult(null);

    try {
      const res = await fetch('/api/skills/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghToken,
          targetRepo,
          skillIds: Array.from(selectedSkills),
          propertyId: selectedProperty,
        }),
      });
      const json = await res.json();
      if (json.data?.prUrl) {
        setResult({ prUrl: json.data.prUrl });
      } else {
        setResult({ error: json.error || 'Deploy failed' });
      }
    } catch (err) {
      setResult({ error: String(err) });
    }
    setDeploying(false);
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-zinc-500">
        <Link href="/skills" className="hover:text-zinc-300">
          Skill Library
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">Deploy</span>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-white">Deploy Skills to Repo</h1>
      <p className="mb-8 text-sm text-zinc-400">
        Select skills and a target property to create a GitHub PR with the skill files.
      </p>

      {/* Steps */}
      <div className="mb-8 flex gap-2">
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              step === s
                ? 'bg-white text-zinc-900'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Step {s}: {s === 1 ? 'Select Skills' : s === 2 ? 'Target' : 'Deploy'}
          </button>
        ))}
      </div>

      {/* Step 1: Select skills */}
      {step === 1 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">
            Select Skills ({selectedSkills.size} selected)
          </h2>
          <div className="space-y-2">
            {skills.map((skill) => (
              <label
                key={skill.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                  selectedSkills.has(skill.id)
                    ? 'border-zinc-600 bg-zinc-800'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSkills.has(skill.id)}
                  onChange={() => toggleSkill(skill.id)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{skill.name}</div>
                  <div className="text-xs text-zinc-400">{skill.description}</div>
                </div>
                <span className="text-xs text-zinc-500">v{skill.version}</span>
              </label>
            ))}
          </div>
          {selectedSkills.size > 0 && (
            <button
              onClick={() => setStep(2)}
              className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
            >
              Next: Select Target
            </button>
          )}
        </div>
      )}

      {/* Step 2: Target */}
      {step === 2 && (
        <div className="max-w-lg space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Target Property
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
            >
              <option value="">Select a property...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.url})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              GitHub Repository (owner/name)
            </label>
            <input
              type="text"
              value={targetRepo}
              onChange={(e) => setTargetRepo(e.target.value)}
              placeholder="pandotic/homedoc"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              GitHub Token
            </label>
            <input
              type="password"
              value={ghToken}
              onChange={(e) => {
                setGhToken(e.target.value);
                localStorage.setItem('gh_token', e.target.value);
              }}
              placeholder="ghp_..."
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Needs repo scope. Stored in browser only.
            </p>
          </div>
          <button
            onClick={() => setStep(3)}
            disabled={!selectedProperty || !targetRepo || !ghToken}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            Next: Review & Deploy
          </button>
        </div>
      )}

      {/* Step 3: Deploy */}
      {step === 3 && (
        <div className="max-w-lg">
          <h2 className="mb-3 text-lg font-semibold text-white">Review</h2>
          <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-2">
            <div className="text-sm">
              <span className="text-zinc-400">Skills: </span>
              <span className="text-white">
                {skills
                  .filter((s) => selectedSkills.has(s.id))
                  .map((s) => s.name)
                  .join(', ')}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-zinc-400">Target repo: </span>
              <span className="text-white">{targetRepo}</span>
            </div>
            <div className="text-sm">
              <span className="text-zinc-400">Property: </span>
              <span className="text-white">
                {properties.find((p) => p.id === selectedProperty)?.name ?? selectedProperty}
              </span>
            </div>
          </div>

          <button
            onClick={deploy}
            disabled={deploying}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {deploying ? 'Creating PR...' : 'Create Pull Request'}
          </button>

          {result?.prUrl && (
            <div className="mt-4 rounded-lg border border-green-800 bg-green-900/20 p-4">
              <p className="text-sm text-green-400">PR created successfully!</p>
              <a
                href={result.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-sm text-blue-400 hover:underline"
              >
                {result.prUrl}
              </a>
            </div>
          )}

          {result?.error && (
            <div className="mt-4 rounded-lg border border-red-800 bg-red-900/20 p-4">
              <p className="text-sm text-red-400">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
