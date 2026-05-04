"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import "./team-hub.css";
import { TeamHubShell } from "./TeamHubShell";
import { TeamHubSidebar } from "./components/team-hub-sidebar";

export default function TeamHubLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div data-team-hub className="dark min-h-full">
      <TeamHubShell>
        <div className="flex gap-0 lg:gap-6">
          <TeamHubSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex-1 w-full lg:w-auto">
            {children}
          </div>
        </div>
      </TeamHubShell>
    </div>
  );
}
