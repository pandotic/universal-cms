"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../utils";
import { useCmsConfig } from "./CmsProvider";
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
  Users,
  Settings,
  History,
  Upload,
  Search,
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
  Users,
  Settings,
  History,
  Upload,
};

interface FlatNavItem {
  label: string;
  href: string;
  icon?: string;
  group: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const cmsConfig = useCmsConfig();

  // Build flat list of nav items filtered by enabled modules
  const allItems: FlatNavItem[] = cmsConfig.adminNav.flatMap((group) =>
    group.items
      .filter((item) => !item.module || cmsConfig.modules[item.module])
      .map((item) => ({
        label: item.label,
        href: item.href,
        icon: item.icon,
        group: group.group,
      }))
  );

  const filteredItems = query
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.group.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  // Group filtered items
  const groupedItems: { group: string; items: FlatNavItem[] }[] = [];
  for (const item of filteredItems) {
    const existing = groupedItems.find((g) => g.group === item.group);
    if (existing) {
      existing.items.push(item);
    } else {
      groupedItems.push({ group: item.group, items: [item] });
    }
  }

  // Flat index for keyboard nav
  const flatFiltered = groupedItems.flatMap((g) => g.items);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setActiveIndex(0);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        setQuery("");
      }
    };

    // Also listen for custom open-command-palette event
    const handleCustomEvent = () => {
      setOpen(true);
      setQuery("");
      setActiveIndex(0);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomEvent);
    };
  }, [open]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keyboard navigation within palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && flatFiltered[activeIndex]) {
      e.preventDefault();
      navigate(flatFiltered[activeIndex].href);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector("[data-active='true']");
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={() => {
          setOpen(false);
          setQuery("");
        }}
      />

      {/* Palette */}
      <div className="relative z-50 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-foreground-tertiary" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search admin pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-0 bg-transparent py-3 text-sm text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-0"
          />
          <kbd className="hidden shrink-0 rounded border border-border bg-surface-secondary px-1.5 py-0.5 text-[10px] font-medium text-foreground-tertiary sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-72 overflow-y-auto p-2">
          {groupedItems.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-foreground-secondary">
              No results found.
            </p>
          ) : (
            groupedItems.map((group) => (
              <div key={group.group} className="mb-1">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                  {group.group}
                </p>
                {group.items.map((item) => {
                  flatIndex++;
                  const currentIndex = flatIndex;
                  const Icon = item.icon ? iconMap[item.icon] : null;
                  const isActive = currentIndex === activeIndex;

                  return (
                    <button
                      key={item.href}
                      data-active={isActive}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-surface-tertiary text-foreground"
                          : "text-foreground-secondary hover:bg-surface-secondary"
                      )}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setActiveIndex(currentIndex)}
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0 text-foreground-tertiary" />}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2">
          <span className="flex items-center gap-1 text-[11px] text-foreground-tertiary">
            <kbd className="rounded border border-border bg-surface-secondary px-1 py-0.5 text-[10px] font-medium">
              ↑↓
            </kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1 text-[11px] text-foreground-tertiary">
            <kbd className="rounded border border-border bg-surface-secondary px-1 py-0.5 text-[10px] font-medium">
              ↵
            </kbd>
            Open
          </span>
          <span className="flex items-center gap-1 text-[11px] text-foreground-tertiary">
            <kbd className="rounded border border-border bg-surface-secondary px-1 py-0.5 text-[10px] font-medium">
              esc
            </kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
