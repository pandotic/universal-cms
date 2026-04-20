"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { DumpBar } from "@/components/team-hub/dump/DumpBar";
import { DumpModal } from "@/components/team-hub/dump/DumpModal";
import { useTeamUser } from "@/hooks/team-hub/useTeamUser";

interface TeamHubShellProps {
  children: ReactNode;
}

export function TeamHubShell({ children }: TeamHubShellProps) {
  const { loading, isMember } = useTeamUser();

  if (loading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center text-[13px]"
        style={{ color: "var(--text-tertiary)" }}
      >
        Loading Team Hub…
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Team Hub is for founders
        </h1>
        <p
          className="mt-2 text-[13px]"
          style={{ color: "var(--text-secondary)" }}
        >
          This area of Pandotic Hub is restricted to the founding team. If you
          think you should have access, contact a super admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <DumpBar />
      {children}
      <DumpModal />
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
