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
export { ModulePreviewPanel } from "./shared/ModulePreviewPanel.js";
export type { ModulePreviewPanelProps } from "./shared/ModulePreviewPanel.js";

// Marketing-CMS module panels — drop-in CRUD UIs for individual cms-core
// modules. Each takes an authenticated SupabaseClient and uses the matching
// data/* helpers under the hood.
export { ContentPageEditor } from "./panels/ContentPageEditor.js";
export type { ContentPageEditorProps } from "./panels/ContentPageEditor.js";
export { RedirectsPanel } from "./panels/RedirectsPanel.js";
export type { RedirectsPanelProps } from "./panels/RedirectsPanel.js";
export { CtaManagerPanel } from "./panels/CtaManagerPanel.js";
export type { CtaManagerPanelProps } from "./panels/CtaManagerPanel.js";
export { FormsPanel } from "./panels/FormsPanel.js";
export type { FormsPanelProps } from "./panels/FormsPanel.js";
export { LandingPagesPanel } from "./panels/LandingPagesPanel.js";
export type { LandingPagesPanelProps } from "./panels/LandingPagesPanel.js";
export { BrandGuidePanel } from "./panels/BrandGuidePanel.js";
export type { BrandGuidePanelProps } from "./panels/BrandGuidePanel.js";
export { MediaLibraryPanel } from "./panels/MediaLibraryPanel.js";
export type { MediaLibraryPanelProps } from "./panels/MediaLibraryPanel.js";
export { SEOPanel } from "./panels/SEOPanel.js";
export type { SEOPanelProps } from "./panels/SEOPanel.js";

// Platform-tier admin panels (ported from @universal-cms/admin-ui)
export { UserManagementPanel } from "./platform/UserManagementPanel.js";
export type { UserManagementPanelProps } from "./platform/UserManagementPanel.js";
export { OrganizationManagementPanel } from "./platform/OrganizationManagementPanel.js";
export type { OrganizationManagementPanelProps } from "./platform/OrganizationManagementPanel.js";
export { FeatureFlagPanel } from "./platform/FeatureFlagPanel.js";
export type { FeatureFlagPanelProps } from "./platform/FeatureFlagPanel.js";
