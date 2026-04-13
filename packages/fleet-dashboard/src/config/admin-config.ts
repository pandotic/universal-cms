/**
 * Fleet-Dashboard Admin Configuration
 *
 * Fleet-dashboard is the master admin interface for the entire Pandotic ecosystem.
 * It enables ALL available admin features (core, hub, admin, and enterprise).
 *
 * Other projects in the fleet can import and extend this config for selective features.
 */

import { fleetAdminConfig } from '@/lib/admin-config';

/**
 * Export fleet config as the default for this application
 */
export const adminConfig = fleetAdminConfig;

/**
 * Feature toggle helper: Check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof typeof adminConfig.features): boolean => {
  return adminConfig.features[feature] ?? false;
};

/**
 * Get enabled features list
 */
export const getEnabledFeatures = (): string[] => {
  return Object.entries(adminConfig.features)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key);
};

/**
 * Get disabled features list
 */
export const getDisabledFeatures = (): string[] => {
  return Object.entries(adminConfig.features)
    .filter(([_, enabled]) => !enabled)
    .map(([key]) => key);
};

export default adminConfig;
