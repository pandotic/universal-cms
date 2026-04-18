/**
 * AdminConfig: Feature toggle system for selective admin module loading
 *
 * Allows fleet-dashboard and consuming projects to enable/disable specific admin features.
 * Supports feature modularity: disabled modules don't render in UI, excluded from bundle (tree-shakeable).
 *
 * Core modules: users, organizations (required)
 * Fleet modules: properties, groups, feature-flags, audit-log, analytics, deployments
 * Enterprise modules (optional): sso, apiKeys, bulkOperations, serviceProviders, riskReports
 */

export interface AdminConfig {
  features: {
    // Core modules (always included in fleet-dashboard)
    users: boolean;
    organizations: boolean;

    // Hub management modules
    properties: boolean;
    groups: boolean;
    agents: boolean;
    social: boolean;

    // Marketing ops modules
    marketing: boolean;
    contentPipeline: boolean;
    linkBuilding: boolean;
    brandAssets: boolean;
    qaReviews: boolean;

    // Admin features
    featureFlags: boolean;
    auditLog: boolean;
    analytics: boolean;
    deployments: boolean;

    // Enterprise/optional features
    sso?: boolean;
    apiKeys?: boolean;
    bulkOperations?: boolean;
    serviceProviders?: boolean;
    riskReports?: boolean;

    // Platform admin features
    systemHealth?: boolean;
    maintenanceMode?: boolean;
    apiDocs?: boolean;
  };
}

/**
 * Default admin config for fleet-dashboard
 * Fleet-dashboard is the master admin interface and enables ALL features
 */
export const fleetAdminConfig: AdminConfig = {
  features: {
    // Core: always enabled
    users: true,
    organizations: true,

    // Hub: all enabled for master admin
    properties: true,
    groups: true,
    agents: true,
    social: true,

    // Marketing ops: all enabled for master admin
    marketing: true,
    contentPipeline: true,
    linkBuilding: true,
    brandAssets: true,
    qaReviews: true,

    // Admin: all enabled for visibility
    featureFlags: true,
    auditLog: true,
    analytics: true,
    deployments: true,

    // Enterprise: all enabled for fleet-dashboard (master admin)
    sso: true,
    apiKeys: true,
    bulkOperations: true,
    serviceProviders: true,
    riskReports: true,

    // Platform admin: all enabled
    systemHealth: true,
    maintenanceMode: true,
    apiDocs: true,
  },
};

/**
 * Minimal config for consuming projects
 * Enable only essential features: users, organizations
 * Extend this for projects with different needs
 */
export const createMinimalAdminConfig = (): AdminConfig => ({
  features: {
    users: true,
    organizations: true,
    properties: false,
    groups: false,
    agents: false,
    social: false,
    marketing: false,
    contentPipeline: false,
    linkBuilding: false,
    brandAssets: false,
    qaReviews: false,
    featureFlags: false,
    auditLog: false,
    analytics: false,
    deployments: false,
  },
});

/**
 * Standard config for mid-size consuming projects
 * Includes core + essential admin features
 */
export const createStandardAdminConfig = (): AdminConfig => ({
  features: {
    users: true,
    organizations: true,
    properties: true,
    groups: true,
    agents: false,
    social: false,
    marketing: false,
    contentPipeline: false,
    linkBuilding: false,
    brandAssets: false,
    qaReviews: false,
    featureFlags: true,
    auditLog: true,
    analytics: false,
    deployments: false,
  },
});

/**
 * Enterprise config for advanced consuming projects
 * Enables all non-SaaS features
 */
export const createEnterpriseAdminConfig = (): AdminConfig => ({
  features: {
    users: true,
    organizations: true,
    properties: true,
    groups: true,
    agents: true,
    social: true,
    marketing: true,
    contentPipeline: true,
    linkBuilding: true,
    brandAssets: true,
    qaReviews: true,
    featureFlags: true,
    auditLog: true,
    analytics: true,
    deployments: true,
    apiKeys: true,
    bulkOperations: true,
    systemHealth: true,
  },
});
