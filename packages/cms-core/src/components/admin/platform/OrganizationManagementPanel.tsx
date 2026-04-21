import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Search, Plus, Users as UsersIcon } from 'lucide-react';
import type { SupabaseClientAdapter, Organization } from '../../../admin/index.js';

export interface OrganizationManagementPanelProps {
  supabase: SupabaseClientAdapter;
  currentUserId: string;
  onOrgSelect?: (org: Organization) => void;
  onViewAsGroupAdmin?: (org: Organization) => void;
}

export function OrganizationManagementPanel({
  supabase,
  currentUserId,
  onOrgSelect,
  onViewAsGroupAdmin,
}: OrganizationManagementPanelProps) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadOrgs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      const { data, error } = result as unknown as { data: Organization[] | null; error: unknown };
      if (error) throw error;
      setOrgs(data ?? []);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => { loadOrgs(); }, [loadOrgs]);

  const filtered = searchTerm
    ? orgs.filter((o) =>
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.organization_type ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : orgs;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Organizations</h2>
          <span className="text-sm text-gray-500">({filtered.length})</span>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search organizations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No organizations found</p>
          </div>
        ) : (
          filtered.map((org) => (
            <div key={org.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div
                  className={onOrgSelect ? 'cursor-pointer' : ''}
                  onClick={() => onOrgSelect?.(org)}
                >
                  <div className="flex items-center gap-3">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt={org.name} className="h-8 w-8 rounded" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{org.name}</p>
                      <p className="text-xs text-gray-500">
                        {org.organization_type} · {org.current_tier}
                        {!org.is_active && <span className="text-red-500 ml-2">(Inactive)</span>}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onViewAsGroupAdmin && (
                    <button
                      onClick={() => onViewAsGroupAdmin(org)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                    >
                      <UsersIcon className="h-3 w-3" />
                      View Admin
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
