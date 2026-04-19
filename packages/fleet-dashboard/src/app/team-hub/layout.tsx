"use client";

import type { ReactNode } from "react";
import "./team-hub.css";
import { QueryProvider } from "./QueryProvider";
import { TeamHubShell } from "./TeamHubShell";

export default function TeamHubLayout({ children }: { children: ReactNode }) {
  return (
    <div data-team-hub className="dark min-h-full">
      <QueryProvider>
        <TeamHubShell>{children}</TeamHubShell>
      </QueryProvider>
    </div>
  );
}
