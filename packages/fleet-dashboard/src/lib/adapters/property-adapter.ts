import type { EntityAdapter } from '@pandotic/universal-cms/admin';

/**
 * Entity adapter for hub_properties.
 * Enables EntityManagementPanel to render properties generically.
 */
export const propertyAdapter: EntityAdapter = {
  entityName: 'Property',
  entityNamePlural: 'Properties',
  tableName: 'hub_properties',
  ownerColumn: 'id',
  displayColumn: 'name',
  secondaryDisplayColumn: 'url',
  fields: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      showInList: true,
      showInDetail: true,
      isPrimary: true,
    },
    {
      key: 'url',
      label: 'URL',
      type: 'text',
      showInList: true,
      showInDetail: true,
    },
    {
      key: 'property_type',
      label: 'Type',
      type: 'select',
      showInList: true,
      showInDetail: true,
      options: [
        { label: 'Site', value: 'site' },
        { label: 'App', value: 'app' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      showInList: true,
      showInDetail: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Archived', value: 'archived' },
        { label: 'Error', value: 'error' },
      ],
    },
    {
      key: 'health_status',
      label: 'Health',
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
    {
      key: 'slug',
      label: 'Slug',
      type: 'text',
      showInList: false,
      showInDetail: true,
    },
    {
      key: 'created_at',
      label: 'Created',
      type: 'date',
      showInList: true,
      showInDetail: true,
    },
  ],
};
