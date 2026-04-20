import type { EntityAdapter } from '@pandotic/universal-cms/admin';

/**
 * Entity adapter for hub_groups.
 * Enables EntityManagementPanel to render groups generically.
 */
export const groupAdapter: EntityAdapter = {
  entityName: 'Group',
  entityNamePlural: 'Groups',
  tableName: 'hub_groups',
  ownerColumn: 'id',
  displayColumn: 'name',
  secondaryDisplayColumn: 'slug',
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
      key: 'slug',
      label: 'Slug',
      type: 'text',
      showInList: true,
      showInDetail: true,
    },
    {
      key: 'group_type',
      label: 'Type',
      type: 'select',
      showInList: true,
      showInDetail: true,
      options: [
        { label: 'Client', value: 'client' },
        { label: 'Internal', value: 'internal' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      key: 'description',
      label: 'Description',
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
