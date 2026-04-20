"use client";

import { ExternalLink } from "lucide-react";
import type { FleetAttentionFlag } from "@pandotic/universal-cms/data/hub-fleet-review";
import {
  useFleetAttention,
  useInitiativesReview,
} from "@/hooks/team-hub/useFleetReview";
import { EmptyState } from "@/components/team-hub/ui/EmptyState";

const SEVERITY_COLORS: Record<FleetAttentionFlag["severity"], string> = {
  critical: "var(--status-red)",
  warn: "var(--status-yellow)",
  info: "var(--status-gray)",
};

function FlagRow({ flag }: { flag: FleetAttentionFlag }) {
  return (
    <a
      href={flag.href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: SEVERITY_COLORS[flag.severity] }}
      />
      <span
        className="text-[13px] font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        {flag.name}
      </span>
      <span
        className="flex-1 text-[12px]"
        style={{ color: "var(--text-tertiary)" }}
      >
        {flag.reason}
      </span>
      <ExternalLink
        size={14}
        style={{ color: "var(--text-tertiary)" }}
      />
    </a>
  );
}

function Subsection({
  title,
  flags,
  isLoading,
  emptyMessage,
}: {
  title: string;
  flags: FleetAttentionFlag[] | undefined;
  isLoading: boolean;
  emptyMessage: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <p
          className="text-[11px] font-medium uppercase tracking-wider"
          style={{ color: "var(--text-tertiary)" }}
        >
          {title}
        </p>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-md"
            style={{ background: "var(--bg-tertiary)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p
        className="text-[11px] font-medium uppercase tracking-wider"
        style={{ color: "var(--text-tertiary)" }}
      >
        {title} {flags?.length ? `(${flags.length})` : ""}
      </p>
      {flags && flags.length > 0 ? (
        flags.map((f) => <FlagRow key={`${f.kind}:${f.id}`} flag={f} />)
      ) : (
        <p
          className="px-3 py-2 text-[12px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {emptyMessage}
        </p>
      )}
    </div>
  );
}

export function FleetReviewSection() {
  const { data: properties, isLoading: propsLoading } = useFleetAttention();
  const { data: initiatives, isLoading: initsLoading } = useInitiativesReview();

  const nothing =
    !propsLoading &&
    !initsLoading &&
    (properties?.length ?? 0) === 0 &&
    (initiatives?.length ?? 0) === 0;

  if (nothing) {
    return (
      <EmptyState message="All properties healthy, no initiatives need review this week." />
    );
  }

  return (
    <div className="space-y-4">
      <Subsection
        title="Properties needing attention"
        flags={properties}
        isLoading={propsLoading}
        emptyMessage="All fleet properties healthy."
      />
      <Subsection
        title="Initiatives in flight"
        flags={initiatives}
        isLoading={initsLoading}
        emptyMessage="No initiatives flagged."
      />
    </div>
  );
}
