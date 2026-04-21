import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, ChevronLeft, ChevronRight, Shield, ShieldOff } from 'lucide-react';
import type { SupabaseClientAdapter, AdminUser } from '../../../admin/index.js';
import { grantRole, revokeRole, getUserRoles, updateAccountStatus, logAdminAction } from '../../../admin/index.js';

export interface UserManagementPanelProps {
  supabase: SupabaseClientAdapter;
  currentUserId: string;
  pageSize?: number;
}

export function UserManagementPanel({
  supabase,
  currentUserId,
  pageSize = 25,
}: UserManagementPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [filter, setFilter] = useState<string>('all');

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filter === 'active') query = query.eq('account_status', 'active');
      if (filter === 'suspended') query = query.eq('account_status', 'suspended');

      const { data, error } = await query as unknown as { data: AdminUser[] | null; error: unknown };
      if (error) throw error;
      setUsers(data ?? []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, currentPage, pageSize, filter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = searchTerm
    ? users.filter((u) =>
        (u.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.display_name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  const handleSuspend = async (userId: string) => {
    if (!confirm('Suspend this user? They will be unable to log in.')) return;
    await updateAccountStatus(supabase, userId, 'suspended', currentUserId);
    loadUsers();
  };

  const handleReactivate = async (userId: string) => {
    await updateAccountStatus(supabase, userId, 'active', currentUserId);
    loadUsers();
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      deactivated: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] ?? colors.active}`}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 bg-gray-200 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-6 w-6 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          <span className="text-sm text-gray-500">({filtered.length} users)</span>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setCurrentPage(0); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All users</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.display_name || 'Unnamed'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">{statusBadge(user.account_status)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.last_active_at ? new Date(user.last_active_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-6 py-4 text-right">
                  {user.account_status === 'active' ? (
                    <button
                      onClick={() => handleSuspend(user.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                      title="Suspend user"
                    >
                      <ShieldOff className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReactivate(user.id)}
                      className="text-sm text-green-600 hover:text-green-800"
                      title="Reactivate user"
                    >
                      <Shield className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
        <span>Page {currentPage + 1}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={users.length < pageSize}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
