// App-level shell (from HomeDoc extraction)
export { AdminShell } from "./AdminShell";
export { AdminSidebar } from "./AdminSidebar";
export { CommandPalette } from "./CommandPalette";
export { ChatPanel } from "./ChatPanel";
export { ChatMessage } from "./ChatMessage";
export { ChatToolResult } from "./ChatToolResult";
export { CmsProvider, useCmsConfig } from "./CmsProvider";

// Cross-tier admin primitives (ported from @universal-cms/admin-ui)
export { AdminLayout } from "./shared/AdminLayout.js";
export type { AdminLayoutProps } from "./shared/AdminLayout.js";
export { StatCard } from "./shared/StatCard.js";
export type { StatCardProps } from "./shared/StatCard.js";
export { AuditLogViewer } from "./shared/AuditLogViewer.js";
export type { AuditLogViewerProps } from "./shared/AuditLogViewer.js";
export { PlatformAdminRoute } from "./shared/PlatformAdminRoute.js";
export type { PlatformAdminRouteProps } from "./shared/PlatformAdminRoute.js";
export { EntityManagementPanel } from "./shared/EntityManagementPanel.js";
export type { EntityManagementPanelProps } from "./shared/EntityManagementPanel.js";

// Platform-tier admin panels (ported from @universal-cms/admin-ui)
export { UserManagementPanel } from "./platform/UserManagementPanel.js";
export type { UserManagementPanelProps } from "./platform/UserManagementPanel.js";
export { OrganizationManagementPanel } from "./platform/OrganizationManagementPanel.js";
export type { OrganizationManagementPanelProps } from "./platform/OrganizationManagementPanel.js";
export { FeatureFlagPanel } from "./platform/FeatureFlagPanel.js";
export type { FeatureFlagPanelProps } from "./platform/FeatureFlagPanel.js";
