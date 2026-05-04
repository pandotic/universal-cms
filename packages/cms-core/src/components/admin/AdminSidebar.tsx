"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CmsNavGroup, CmsNavItem } from "../../config";
import { useCmsConfig } from "./CmsProvider";
import { cn } from "../../utils";
import {
  LayoutDashboard,
  FileText,
  List,
  Image,
  Building2,
  FolderTree,
  Award,
  GraduationCap,
  MessageSquare,
  Link as LinkIcon,
  BarChart3,
  Briefcase,
  Users,
  Settings,
  History,
  Upload,
  BookOpen,
  BookA,
  Scale,
  Search,
  Bug,
  Tag,
  Link2 as LinkIcon2,
  ArrowRight,
  Code2,
  ExternalLink,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileText,
  List,
  Image,
  Building2,
  FolderTree,
  Award,
  GraduationCap,
  MessageSquare,
  Link: LinkIcon,
  BarChart3,
  Briefcase,
  Users,
  Settings,
  History,
  Upload,
  BookOpen,
  BookA,
  Scale,
  Search,
  Bug,
  Tag,
  LinkIcon2,
  ArrowRight,
  Code2,
};

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminSidebar({ collapsed = false, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname();
  const cmsConfig = useCmsConfig();

  const inactiveMode = cmsConfig.inactiveModulesMode ?? "hide";
  const previewBase = (cmsConfig.inactiveModulePreviewBase ?? "/admin/modules").replace(/\/$/, "");

  // In `'hide'` mode (default), nav items for disabled modules are filtered
  // out entirely. In `'preview'` mode, they pass through and are rendered
  // greyed-out, linking to a per-module preview page so operators can see
  // every module the universal CMS ships.
  const visibleNav = cmsConfig.adminNav
    .map((group: CmsNavGroup) => ({
      ...group,
      items: group.items.filter((item: CmsNavItem) => {
        if (!item.module) return true;
        if (cmsConfig.modules[item.module]) return true;
        return inactiveMode === "preview";
      }),
    }))
    .filter((group: CmsNavGroup) => group.items.length > 0);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-surface transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        {!collapsed && (
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-foreground-secondary"
          >
            <span className="truncate">{cmsConfig.siteName}</span>
            <ExternalLink className="h-3 w-3 shrink-0 text-foreground-tertiary" />
          </Link>
        )}
        {collapsed && (
          <Link
            href="/"
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-foreground hover:bg-surface-tertiary"
            title={cmsConfig.siteName}
          >
            {cmsConfig.siteName.charAt(0)}
          </Link>
        )}
        {onToggleCollapse && !collapsed && (
          <button
            onClick={onToggleCollapse}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-tertiary hover:bg-surface-tertiary hover:text-foreground-secondary"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {visibleNav.map((group) => (
          <div key={group.group} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                {group.group}
              </p>
            )}
            {collapsed && <div className="mb-1 mx-2 h-px bg-surface-tertiary" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon ? iconMap[item.icon] : null;
                const isInactive =
                  !!item.module && !cmsConfig.modules[item.module];
                const href = isInactive
                  ? `${previewBase}/${item.module}`
                  : item.href;
                const isActive =
                  href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(href);

                return (
                  <li key={item.href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-surface-tertiary text-foreground"
                          : isInactive
                            ? "text-foreground-tertiary hover:bg-surface-secondary hover:text-foreground-secondary"
                            : "text-foreground-secondary hover:bg-surface-secondary hover:text-foreground",
                        collapsed && "justify-center px-0"
                      )}
                      title={
                        collapsed
                          ? isInactive
                            ? `${item.label} (not enabled)`
                            : item.label
                          : isInactive
                            ? "Module not enabled — click to preview"
                            : undefined
                      }
                    >
                      {Icon && (
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive
                              ? "text-foreground"
                              : isInactive
                                ? "text-foreground-tertiary/60"
                                : "text-foreground-tertiary"
                          )}
                        />
                      )}
                      {!collapsed && (
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="truncate">{item.label}</span>
                          {isInactive && (
                            <span className="shrink-0 rounded-full bg-surface-secondary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                              Off
                            </span>
                          )}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom section: user avatar placeholder */}
      <div className="border-t border-border p-3">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2 py-1.5",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-active text-xs font-semibold text-foreground-secondary">
            A
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">Admin</p>
              <p className="truncate text-xs text-foreground-secondary">admin@cms.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
