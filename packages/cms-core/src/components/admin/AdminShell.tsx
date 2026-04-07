"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cmsConfig } from "../../config";
import { cn } from "../../utils";
import { AdminSidebar } from "./AdminSidebar";
import { CommandPalette } from "./CommandPalette";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import {
  Menu,
  X,
  Search,
  ChevronRight,
  User,
  LogOut,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Bot,
} from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { ThemeToggle } from "../theme/ThemeToggle";

interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, href: currentPath });
  }

  return crumbs;
}

export function AdminShell({ children, title, description }: AdminShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Cmd+K to open command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-command-palette"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const breadcrumbs = buildBreadcrumbs(pathname);

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-60">
            <AdminSidebar collapsed={false} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-200",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-60"
        )}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 lg:px-6">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>

          {/* Breadcrumbs */}
          <nav className="hidden items-center gap-1 text-sm sm:flex">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.href}>
                {i > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-foreground-muted" />
                )}
                {i === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-foreground">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-foreground-secondary hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Mobile title */}
          <span className="text-sm font-semibold text-foreground sm:hidden">
            {title || cmsConfig.siteName}
          </span>

          <div className="flex-1" />

          {/* Search trigger */}
          <Button
            variant="outline"
            size="sm"
            className="hidden gap-2 text-foreground-secondary sm:flex"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("open-command-palette"))
            }
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs">Search...</span>
            <kbd className="ml-2 rounded border border-border bg-surface-secondary px-1.5 py-0.5 text-[10px] font-medium text-foreground-tertiary">
              {typeof navigator !== "undefined" &&
              /Mac/.test(navigator.userAgent)
                ? "\u2318K"
                : "Ctrl+K"}
            </kbd>
          </Button>

          {/* Mobile search icon */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("open-command-palette"))
            }
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Theme toggle */}
          <ThemeToggle className="hidden sm:inline-flex" />

          {/* AI Chat toggle */}
          <Button
            variant={chatOpen ? "default" : "outline"}
            size="sm"
            className="hidden gap-2 sm:flex"
            onClick={() => setChatOpen((prev) => !prev)}
            title="Toggle AI Assistant"
          >
            <Bot className="h-3.5 w-3.5" />
            <span className="text-xs">AI</span>
          </Button>
          <Button
            variant={chatOpen ? "default" : "ghost"}
            size="icon"
            className="sm:hidden"
            onClick={() => setChatOpen((prev) => !prev)}
          >
            <Bot className="h-4 w-4" />
          </Button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full bg-active text-xs font-semibold text-foreground-secondary hover:bg-border-strong transition-colors">
              A
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground">Admin</p>
                <p className="text-xs text-foreground-secondary">
                  admin@cms.com
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => (window.location.href = "/admin/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={() => {}}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Content + Chat panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {(title || description) && (
              <div className="mb-6">
                {title && (
                  <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                )}
                {description && (
                  <p className="mt-1 text-sm text-foreground-secondary">{description}</p>
                )}
              </div>
            )}
            {children}
          </main>

          {/* AI Chat Panel */}
          {chatOpen && (
            <div className="w-80 shrink-0 lg:w-96 h-[calc(100vh-3.5rem)]">
              <ChatPanel onClose={() => setChatOpen(false)} />
            </div>
          )}
        </div>
      </div>

      {/* Command palette */}
      <CommandPalette />
    </div>
  );
}
