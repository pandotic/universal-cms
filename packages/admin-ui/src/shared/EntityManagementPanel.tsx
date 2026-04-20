import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SupabaseClientAdapter, EntityAdapter } from '@universal-cms/admin-core';

export interface EntityManagementPanelProps {
  supabase: SupabaseClientAdapter;
  adapter: EntityAdapter;
  /** Optional: only show entities owned by this user */
  ownerId?: string;
  /** Called when an entity row is clicked */
  onEntitySelect?: (entity: Record<string, unknown>) => void;
  /** Slot for an "Add" button or custom action */
  headerActions?: React.ReactNode;
  /** Page size for pagination */
  pageSize?: number;
}

/**
 * A generic entity management panel that renders list views
 * based on the EntityAdapter configuration.
 *
 * This is the DOMAIN-ADAPTABLE pattern: in HomeDoc it shows homes,
 * in ConcertBucket it shows concerts, etc.
 */
export function EntityManagementPanel({
  supabase,
  adapter,
  ownerId,
  onEntitySelect,
  headerActions,
  pageSize = 25,
}: EntityManagementPanelProps) {
  const [entities, setEntities] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const listFields = adapter.fields.filter((f) => f.showInList);

  const loadEntities = useCallback(async () => {
    setIsLoading(true);
    try {
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from(adapter.tableName)
        .select(adapter.listSelectColumns ?? '*')
        .range(from, to)
        .order(adapter.displayColumn);

      if (ownerId) {
        query = query.eq(adapter.ownerColumn, ownerId);
      }

      const { data, error } = await query as unknown as {
        data: Record<string, unknown>[] | null;
        error: unknown;
      };

      if (error) throw error;
      setEntities(data ?? []);
      setTotalCount(data?.length === pageSize ? (currentPage + 2) * pageSize : (currentPage * pageSize) + (data?.length ?? 0));
    } catch (error) {
      console.error(`Error loading ${adapter.entityNamePlural}:`, error);
      setEntities([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, adapter, ownerId, currentPage, pageSize]);

  useEffect(() => { loadEntities(); }, [loadEntities]);

  const filtered = searchTerm
    ? entities.filter((e) => {
        const display = String(e[adapter.displayColumn] ?? '').toLowerCase();
        const secondary = adapter.secondaryDisplayColumn
          ? String(e[adapter.secondaryDisplayColumn] ?? '').toLowerCase()
          : '';
        return display.includes(searchTerm.toLowerCase()) || secondary.includes(searchTerm.toLowerCase());
      })
    : entities;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-zinc-800" />
          {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded bg-zinc-800" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
      <div className="border-b border-zinc-800 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">{adapter.entityNamePlural}</h2>
          {headerActions}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder={`Search ${adapter.entityNamePlural.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-transparent focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              {listFields.map((field) => (
                <th key={field.key} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={listFields.length} className="px-6 py-12 text-center text-zinc-500">
                  No {adapter.entityNamePlural.toLowerCase()} found
                </td>
              </tr>
            ) : (
              filtered.map((entity) => {
                const display = adapter.transformForDisplay
                  ? adapter.transformForDisplay(entity)
                  : entity;

                return (
                  <tr
                    key={entity.id as string}
                    onClick={() => onEntitySelect?.(entity)}
                    className={onEntitySelect ? 'cursor-pointer hover:bg-zinc-800/50' : ''}
                  >
                    {listFields.map((field) => (
                      <td key={field.key} className="px-6 py-4 text-sm text-zinc-200">
                        {field.type === 'boolean'
                          ? (display[field.key] ? 'Yes' : 'No')
                          : String(display[field.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-3 text-sm text-zinc-500">
        <span>
          Showing {currentPage * pageSize + 1}–{currentPage * pageSize + filtered.length}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={entities.length < pageSize}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
