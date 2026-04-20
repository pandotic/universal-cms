import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Search, Download } from 'lucide-react';
import type { SupabaseClientAdapter } from '../../../admin/index.js';
import { getAuditLogs } from '../../../admin/index.js';

export interface AuditLogViewerProps {
  supabase: SupabaseClientAdapter;
  limit?: number;
}

export function AuditLogViewer({ supabase, limit = 50 }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAuditLogs(supabase, { limit });
      setLogs(data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, limit]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const actionTypes = Array.from(new Set(logs.map((log) => log.action_type as string)));

  const filteredLogs = logs.filter((log) => {
    if (filterAction && log.action_type !== filterAction) return false;
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (log.action_type as string).toLowerCase().includes(searchLower) ||
      JSON.stringify(log.action_details).toLowerCase().includes(searchLower)
    );
  });

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionColor = (actionType: string) => {
    if (actionType.includes('GRANTED') || actionType.includes('CREATED')) return 'text-green-600';
    if (actionType.includes('REVOKED') || actionType.includes('REMOVED') || actionType.includes('DELETED')) return 'text-red-600';
    if (actionType.includes('UPDATED') || actionType.includes('CHANGED')) return 'text-blue-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
          <span className="text-sm text-gray-500">({filteredLogs.length} entries)</span>
        </div>
        <button
          onClick={exportLogs}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search audit logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All actions</option>
          {actionTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No audit log entries found</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const actionType = String(log.action_type ?? '');
            const targetType = log.target_type ? String(log.target_type) : null;
            const targetId = log.target_id ? String(log.target_id) : null;
            const createdAt = String(log.created_at ?? '');
            const details = log.action_details as Record<string, unknown> | null;
            const beforeState = log.before_state as Record<string, unknown> | null;
            const afterState = log.after_state as Record<string, unknown> | null;
            const hasDetails = details != null && Object.keys(details).length > 0;
            const hasDiff = beforeState != null || afterState != null;
            return (
            <div key={String(log.id)} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`font-medium text-sm ${getActionColor(actionType)}`}>
                    {actionType}
                  </span>
                  {targetType && (
                    <span className="text-xs text-gray-500 ml-2">
                      on {targetType}
                      {targetId && ` (${targetId.slice(0, 8)}...)`}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(createdAt).toLocaleString()}
                </span>
              </div>
              {hasDetails && (
                <pre className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2 overflow-x-auto">
                  {JSON.stringify(details, null, 2)}
                </pre>
              )}
              {hasDiff && (
                <div className="mt-2 flex gap-4 text-xs">
                  {beforeState && (
                    <div className="flex-1">
                      <span className="font-medium text-red-600">Before:</span>
                      <pre className="mt-1 bg-red-50 rounded p-1">{JSON.stringify(beforeState, null, 2)}</pre>
                    </div>
                  )}
                  {afterState && (
                    <div className="flex-1">
                      <span className="font-medium text-green-600">After:</span>
                      <pre className="mt-1 bg-green-50 rounded p-1">{JSON.stringify(afterState, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
