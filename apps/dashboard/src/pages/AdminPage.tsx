import React, { useState, useEffect } from 'react';
import { Users, Building2, Globe, Flag, Activity, BarChart3 } from 'lucide-react';
import {
  StatCard,
  UserManagementPanel,
  OrganizationManagementPanel,
  EntityManagementPanel,
  FeatureFlagPanel,
  AuditLogViewer,
} from '@pandotic/universal-cms/components/admin';
import type { SupabaseClientAdapter } from '@pandotic/universal-cms/admin';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { connectedAppAdapter } from '../adapters/connectedApp';

type Tab = 'overview' | 'users' | 'organizations' | 'apps' | 'flags' | 'audit';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'organizations', label: 'Organizations', icon: Building2 },
  { key: 'apps', label: 'Connected Apps', icon: Globe },
  { key: 'flags', label: 'Feature Flags', icon: Flag },
  { key: 'audit', label: 'Audit Log', icon: Activity },
];

function OverviewTab({ sb }: { sb: SupabaseClientAdapter }) {
  const [counts, setCounts] = useState({ apps: 0, users: 0, orgs: 0, flags: 0 });

  useEffect(() => {
    async function load() {
      const [apps, users, orgs, flags] = await Promise.all([
        sb.from('connected_apps').select('id'),
        sb.from('user_profiles').select('id'),
        sb.from('organizations').select('id'),
        sb.from('feature_flags').select('id'),
      ]);

      const count = (result: unknown) => {
        const r = result as { data: unknown[] | null };
        return r.data?.length ?? 0;
      };

      setCounts({
        apps: count(apps),
        users: count(users),
        orgs: count(orgs),
        flags: count(flags),
      });
    }
    load();
  }, [sb]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Connected Apps" value={counts.apps} icon={Globe} color="blue" />
      <StatCard title="Users" value={counts.users} icon={Users} color="green" />
      <StatCard title="Organizations" value={counts.orgs} icon={Building2} color="purple" />
      <StatCard title="Feature Flags" value={counts.flags} icon={Flag} color="orange" />
    </div>
  );
}

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { user } = useAuth();
  const sb = supabase as unknown as SupabaseClientAdapter;
  const userId = user?.id ?? '';

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Administration</h2>

      {/* Tab bar */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab sb={sb} />}
      {activeTab === 'users' && (
        <UserManagementPanel supabase={sb} currentUserId={userId} />
      )}
      {activeTab === 'organizations' && (
        <OrganizationManagementPanel supabase={sb} currentUserId={userId} />
      )}
      {activeTab === 'apps' && (
        <EntityManagementPanel supabase={sb} adapter={connectedAppAdapter} />
      )}
      {activeTab === 'flags' && (
        <FeatureFlagPanel supabase={sb} currentUserId={userId} />
      )}
      {activeTab === 'audit' && (
        <AuditLogViewer supabase={sb} />
      )}
    </div>
  );
}
