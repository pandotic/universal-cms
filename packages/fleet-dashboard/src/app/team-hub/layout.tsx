import type { ReactNode } from "react";
import "./team-hub.css";
import { TeamHubShell } from "./TeamHubShell";

export default function TeamHubLayout({ children }: { children: ReactNode }) {
  return (
    <div data-team-hub className="dark min-h-full">
      <TeamHubShell>{children}</TeamHubShell>
    </div>
  );
}
