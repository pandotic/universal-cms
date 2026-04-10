import type { EntityAdapter } from '@universal-cms/admin-core';

export const connectedAppAdapter: EntityAdapter = {
  entityName: 'App',
  entityNamePlural: 'Apps',
  tableName: 'connected_apps',
  ownerColumn: 'created_by',
  displayColumn: 'name',
  secondaryDisplayColumn: 'url',
  fields: [
    { key: 'name', label: 'Name', type: 'text', showInList: true, showInDetail: true, isPrimary: true },
    { key: 'url', label: 'URL', type: 'text', showInList: true, showInDetail: true },
    { key: 'supabase_project_url', label: 'Supabase URL', type: 'text', showInList: false, showInDetail: true },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      showInList: true,
      showInDetail: true,
      options: [
        { label: 'Healthy', value: 'healthy' },
        { label: 'Degraded', value: 'degraded' },
        { label: 'Down', value: 'down' },
        { label: 'Unknown', value: 'unknown' },
      ],
    },
    { key: 'last_health_check', label: 'Last Health Check', type: 'date', showInList: true, showInDetail: true },
  ],
};
