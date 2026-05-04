"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ACTIVE_MODULES_SOURCE } from "@/cms.config";

interface CountRow {
  total: number;
  byStatus: Record<string, number>;
}

const EMPTY: CountRow = { total: 0, byStatus: {} };

function tally(rows: { status: string | null }[] | null): CountRow {
  if (!rows) return EMPTY;
  const byStatus: Record<string, number> = {};
  for (const r of rows) {
    const k = r.status ?? "unknown";
    byStatus[k] = (byStatus[k] ?? 0) + 1;
  }
  return { total: rows.length, byStatus };
}

export default function AdminOverviewPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [projects, setProjects] = useState<CountRow>(EMPTY);
  const [content, setContent] = useState<CountRow>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.from("projects").select("status"),
      supabase.from("content_pages").select("status"),
    ]).then(([{ data: projectRows }, { data: contentRows }]) => {
      if (cancelled) return;
      setProjects(tally(projectRows as { status: string | null }[] | null));
      setContent(tally(contentRows as { status: string | null }[] | null));
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pandotic CMS
        </h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Marketing CMS for pandotic.ai. Modules with backing data are live;
          everything else in the sidebar is a preview of what the universal
          CMS ships with.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard
          title="Projects"
          href="/admin/projects"
          total={projects.total}
          byStatus={projects.byStatus}
        />
        <SummaryCard
          title="Content Pages"
          href="/admin/content"
          total={content.total}
          byStatus={content.byStatus}
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">
          About this admin
        </h2>
        <p className="mt-1 text-xs text-foreground-secondary">
          Pandotic.ai activates a small subset of the universal CMS modules.
          Other modules appear in the sidebar greyed out and link to a sample
          preview. To switch one on for this site, manage it from{" "}
          <a
            href="https://pandhub.netlify.app/properties/pandotic-site/modules"
            target="_blank"
            rel="noreferrer noopener"
            className="text-foreground underline underline-offset-2"
          >
            Pandotic Hub → Properties → Modules
          </a>{" "}
          and trigger a redeploy.
        </p>
        <ActivationSource />
      </div>
    </div>
  );
}

function ActivationSource() {
  const { source, generatedAt } = ACTIVE_MODULES_SOURCE;
  if (source === "hub") {
    return (
      <p className="mt-3 text-[11px] text-foreground-tertiary">
        Module activations were synced from Hub
        {generatedAt
          ? ` at ${new Date(generatedAt).toLocaleString()}`
          : ""}
        . Trigger a new build to pick up changes.
      </p>
    );
  }
  return (
    <p className="mt-3 text-[11px] text-amber-300/80">
      Hub sync skipped — using local fallback in{" "}
      <span className="font-mono">cms.config.ts</span>. Set{" "}
      <span className="font-mono">HUB_SUPABASE_URL</span> +{" "}
      <span className="font-mono">HUB_SUPABASE_ANON_KEY</span> in the build
      environment to enable Hub-driven activation.
    </p>
  );
}

function SummaryCard({
  title,
  href,
  total,
  byStatus,
}: {
  title: string;
  href: string;
  total: number;
  byStatus: Record<string, number>;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <span className="text-2xl font-semibold text-foreground">{total}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {Object.entries(byStatus).map(([status, n]) => (
          <span
            key={status}
            className="rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] text-foreground-secondary"
          >
            {status}: {n}
          </span>
        ))}
        {Object.keys(byStatus).length === 0 && (
          <span className="text-[11px] text-foreground-tertiary">No rows</span>
        )}
      </div>
    </Link>
  );
}
