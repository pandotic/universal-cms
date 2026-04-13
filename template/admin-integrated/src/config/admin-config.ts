import type { AdminConfig } from "@pandotic/admin-ui";

/**
 * Standard admin configuration for consuming projects.
 * Enables core features (users, organizations) + feature flags + audit logging.
 * Excludes enterprise features (SSO, API keys, bulk operations).
 */
export const adminConfig: AdminConfig = {
  features: {
    // Core features - always recommended
    users: true,
    organizations: true,

    // Essential for rollout management
    featureFlags: true,

    // Recommended for compliance
    auditLog: true,

    // Enterprise features - disabled by default
    sso: false,
    apiKeys: false,
    bulkOperations: false,
  },
};

/**
 * Helper to check if a feature is enabled.
 * Usage: if (isFeatureEnabled('users')) { render UserPanel }
 */
export function isFeatureEnabled(
  feature: keyof AdminConfig["features"]
): boolean {
  return adminConfig.features[feature] === true;
}

/**
 * Get list of all enabled features.
 * Usage: const enabled = getEnabledFeatures()
 */
export function getEnabledFeatures(): (keyof AdminConfig["features"])[] {
  return Object.entries(adminConfig.features)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature as keyof AdminConfig["features"]);
}
