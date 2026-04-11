import React from 'react';
import { Flag, ToggleLeft, ToggleRight } from 'lucide-react';
import type { SupabaseClientAdapter, FeatureFlag } from '@universal-cms/admin-core';
import { useFeatureFlags, toggleFeatureFlag } from '@universal-cms/admin-core';

export interface FeatureFlagPanelProps {
  supabase: SupabaseClientAdapter;
  currentUserId: string;
}

export function FeatureFlagPanel({ supabase, currentUserId }: FeatureFlagPanelProps) {
  const { flags, isLoading, refresh } = useFeatureFlags(supabase);

  const handleToggle = async (flag: FeatureFlag) => {
    await toggleFeatureFlag(supabase, flag.flag_key, !flag.is_enabled, currentUserId);
    refresh();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <Flag className="h-6 w-6 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">Feature Flags</h2>
        <span className="text-sm text-gray-500">({flags.length})</span>
      </div>

      {flags.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Flag className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>No feature flags configured</p>
          <p className="text-xs mt-1">Add flags to the feature_flags table to manage them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div key={flag.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{flag.flag_key}</code>
                    <span className="text-sm font-medium text-gray-900">{flag.flag_name}</span>
                  </div>
                  {flag.description && <p className="text-xs text-gray-500 mt-1">{flag.description}</p>}
                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
                    {flag.rollout_percentage > 0 && flag.rollout_percentage < 100 && (
                      <span>Rollout: {flag.rollout_percentage}%</span>
                    )}
                    {flag.target_roles.length > 0 && <span>Roles: {flag.target_roles.join(', ')}</span>}
                    {flag.target_org_ids.length > 0 && <span>Orgs: {flag.target_org_ids.length}</span>}
                    {flag.target_user_ids.length > 0 && <span>Users: {flag.target_user_ids.length}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(flag)}
                  className={`transition-colors ${flag.is_enabled ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {flag.is_enabled ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
