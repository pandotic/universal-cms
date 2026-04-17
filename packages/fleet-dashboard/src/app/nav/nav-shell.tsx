"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { CommandPalette } from "./command-palette";
import { Breadcrumbs } from "@/components/breadcrumbs";

export function NavShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const mainPad = sidebarCollapsed ? "lg:pl-14" : "lg:pl-64";

  // Global ⌘K handler
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />
      <div className={`${mainPad} transition-[padding] duration-200`}>
        <TopBar
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <Breadcrumbs />
        <main id="main-content" className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
