'use client';

import { useEffect, useState } from 'react';
import {
  marketingSkillTemplates,
  type MarketingSkillTemplate,
  type SkillPlatform,
} from '@pandotic/skill-library';

const platformLabels: Record<SkillPlatform, string> = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
  tiktok: 'TikTok',
  email: 'Email',
  seo: 'SEO',
  analytics: 'Analytics',
  content: 'Content',
  social_organic: 'Social Organic',
  cross_platform: 'Cross-Platform',
};

const categoryColors: Record<string, string> = {
  acquisition: 'bg-blue-500/20 text-blue-400',
  retention: 'bg-green-500/20 text-green-400',
  engagement: 'bg-purple-500/20 text-purple-400',
  analytics: 'bg-amber-500/20 text-amber-400',
  content_creation: 'bg-pink-500/20 text-pink-400',
  brand_management: 'bg-cyan-500/20 text-cyan-400',
  automation: 'bg-orange-500/20 text-orange-400',
};

export default function SkillsPage() {
  const [filter, setFilter] = useState<SkillPlatform | 'all'>('all');
  const [skills, setSkills] = useState<MarketingSkillTemplate[]>(marketingSkillTemplates);

  useEffect(() => {
    if (filter === 'all') {
      setSkills(marketingSkillTemplates);
    } else {
      setSkills(marketingSkillTemplates.filter((s) => s.platform === filter));
    }
  }, [filter]);

  const platforms = Array.from(new Set(marketingSkillTemplates.map((s) => s.platform)));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Skill Library</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Marketing skills you can deploy across your fleet. Select a skill to configure and deploy to properties.
          </p>
        </div>
      </div>

      {/* Platform filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-white text-zinc-900'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          All ({marketingSkillTemplates.length})
        </button>
        {platforms.map((platform) => (
          <button
            key={platform}
            onClick={() => setFilter(platform)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === platform
                ? 'bg-white text-zinc-900'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {platformLabels[platform]}
          </button>
        ))}
      </div>

      {/* Skill cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <div
            key={skill.slug}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700"
          >
            <div className="mb-3 flex items-start justify-between">
              <h3 className="font-semibold text-white">{skill.name}</h3>
              <span
                className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  categoryColors[skill.category] ?? 'bg-zinc-700 text-zinc-300'
                }`}
              >
                {skill.category.replace('_', ' ')}
              </span>
            </div>

            <p className="mb-4 text-sm text-zinc-400 line-clamp-2">
              {skill.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  {platformLabels[skill.platform]}
                </span>
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  {skill.execution_mode}
                </span>
              </div>
              {skill.default_schedule && (
                <span className="text-xs text-zinc-500" title={`Cron: ${skill.default_schedule}`}>
                  Scheduled
                </span>
              )}
            </div>

            {skill.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {skill.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-zinc-800/50 px-1.5 py-0.5 text-[10px] text-zinc-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {skills.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-zinc-400">No skills match the current filter.</p>
        </div>
      )}
    </div>
  );
}
