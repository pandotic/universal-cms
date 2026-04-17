"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { Breadcrumbs } from "@/components/breadcrumbs";

export function NavShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const mainPad = sidebarCollapsed ? "lg:pl-14" : "lg:pl-64";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />
      <div className={`${mainPad} transition-[padding] duration-200`}>
        <TopBar onOpenSidebar={() => setSidebarOpen(true)} />
        <Breadcrumbs />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
