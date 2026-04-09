/**
 * Entity Adapter — the plugin slot for app-specific entities.
 *
 * In HomeDoc the entity is "Home/Property".
 * In ConcertBucket the entity is "Concert/Venue".
 * In BidSmarter the entity is "Bid/Project".
 *
 * The adapter tells the admin system what the entity is called,
 * what fields it has, and how to query/display it.
 */

export interface EntityField {
  /** Database column name */
  key: string;
  /** Human-readable label */
  label: string;
  /** Field type for rendering */
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'json';
  /** Show in list view? */
  showInList: boolean;
  /** Show in detail view? */
  showInDetail: boolean;
  /** Is this the primary display field (like "address" or "title")? */
  isPrimary?: boolean;
  /** Select options (for type: 'select') */
  options?: Array<{ label: string; value: string }>;
}

export interface EntityAdapter<T = Record<string, unknown>> {
  /** Singular name: "Home", "Concert", "Bid" */
  entityName: string;
  /** Plural name: "Homes", "Concerts", "Bids" */
  entityNamePlural: string;
  /** Supabase table name */
  tableName: string;
  /** Column that references the owning user (e.g., "user_id") */
  ownerColumn: string;
  /** Column used as the primary display value (e.g., "address") */
  displayColumn: string;
  /** Optional column for a secondary display value (e.g., "city") */
  secondaryDisplayColumn?: string;
  /** Optional column for a photo/image URL */
  imageColumn?: string;
  /** Field definitions for list and detail views */
  fields: EntityField[];
  /** Optional: custom select columns for list queries */
  listSelectColumns?: string;
  /** Optional: transform raw DB row into display format */
  transformForDisplay?: (row: T) => Record<string, unknown>;
}

/**
 * Example entity adapter for HomeDoc:
 *
 * ```ts
 * const homeAdapter: EntityAdapter = {
 *   entityName: 'Home',
 *   entityNamePlural: 'Homes',
 *   tableName: 'homes',
 *   ownerColumn: 'user_id',
 *   displayColumn: 'address',
 *   secondaryDisplayColumn: 'city',
 *   imageColumn: 'custom_photo_url',
 *   fields: [
 *     { key: 'address', label: 'Address', type: 'text', showInList: true, showInDetail: true, isPrimary: true },
 *     { key: 'city', label: 'City', type: 'text', showInList: true, showInDetail: true },
 *     { key: 'state', label: 'State', type: 'text', showInList: true, showInDetail: true },
 *     { key: 'zip_code', label: 'ZIP', type: 'text', showInList: false, showInDetail: true },
 *     { key: 'year_built', label: 'Year Built', type: 'number', showInList: false, showInDetail: true },
 *     { key: 'square_footage', label: 'Sq Ft', type: 'number', showInList: true, showInDetail: true },
 *   ],
 * };
 * ```
 */
export type { EntityAdapter as default };
