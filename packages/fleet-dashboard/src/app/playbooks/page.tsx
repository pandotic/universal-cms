"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bot, CheckCircle2, ChevronRight, Circle, ClipboardList,
  Globe, Loader2, Plus, RefreshCcw, Rocket, Wrench,
} from "lucide-react";
import type { HubPlaybookRun, HubPlaybookTemplate, PlaybookStatus } from "@pandotic/universal-cms/types/playbooks";

interface DashboardData {
  templates: HubPlaybookTemplate[];
  runs: HubPlaybookRun[];
}

const CATEGORY_COLOR: Record<string, string> = {
  onboarding: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
  upgrade: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
  deploy: "bg-violet-500/10 text-violet-300 ring-violet-500/30",
  audit: "bg-blue-500/10 text-blue-300 ring-blue-500/30",
};

const STEP_ICONS: Record<string, React.ReactNode> = {
  deploy_skill: <Rocket className="h-3.5 w-3.5" />,
  upgrade_cms: <RefreshCcw className="h-3.5 w-3.5" />,
  run_agent: <Bot className="h-3.5 w-3.5" />,
  open_url: <Globe className="h-3.5 w-3.5" />,
  manual: <Wrench className="h-3.5 w-3.5" />,
};

function statusBadge(status: PlaybookStatus) {
  const map: Record<PlaybookStatus, string> = {
    not_started: "text-zinc-500 bg-zinc-800",
    in_progress: "text-blue-300 bg-blue-500/10 ring-blue-500/30",
    completed: "text-emerald-300 bg-emerald-500/10 ring-emerald-500/30",
    cancelled: "text-zinc-500 bg-zinc-800",
  };
  return map[status] ?? map.not_started;
}

export default function PlaybooksPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/playbooks")
      .then((r) => r.json())
      .then((b) => { if (b.data) setData(b.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeRuns = data?.runs.filter((r) => r.status === "in_progress") ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Playbooks</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Guided checklists for common operations — onboarding, upgrades, audits.
          </p>
        </div>
      </div>

      {/* Active runs */}
      {activeRuns.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">In progress</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeRuns.map((run) => {
              const template = data?.templates.find((t) => t.id === run.template_id);
              return (
                <Link key={run.id} href={`/playbooks/runs/${run.id}`}
                  className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 hover:bg-blue-500/10 transition-colors">
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-white">{template?.name ?? "Playbook"}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ring-inset ${statusBadge("in_progress")}`}>
                      in progress
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    Started {new Date(run.started_at ?? run.created_at).toLocaleDateString()}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Templates */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Playbook templates</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(data?.templates ?? []).map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TemplateCard({ template }: { template: HubPlaybookTemplate }) {
  const catClass = CATEGORY_COLOR[template.category ?? ""] ?? "bg-zinc-800 text-zinc-400 ring-zinc-700";
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 shrink-0 text-zinc-500" />
            <h3 className="font-medium text-white truncate">{template.name}</h3>
          </div>
          {template.description && (
            <p className="mt-1.5 text-sm text-zinc-400 leading-snug">{template.description}</p>
          )}
        </div>
        {template.category && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${catClass}`}>
            {template.category}
          </span>
        )}
      </div>
      <div className="mt-4">
        <StartPlaybookButton templateId={template.id} templateName={template.name} />
      </div>
    </div>
  );
}

function StartPlaybookButton({ templateId, templateName }: { templateId: string; templateName: string }) {
  const [open, setOpen] = useState(false);
  const [propertyId, setPropertyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function start() {
    if (!propertyId.trim()) return;
    setLoading(true);
    try {
      const r = await fetch("/api/playbooks/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, propertyId: propertyId.trim() }),
      });
      if (r.ok) { setDone(true); setTimeout(() => { setDone(false); setOpen(false); setPropertyId(""); }, 1500); }
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
      >
        <Plus className="h-3.5 w-3.5" /> Start playbook
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={propertyId}
        onChange={(e) => setPropertyId(e.target.value)}
        placeholder="Property ID (UUID)…"
        className="w-full rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
        autoFocus
      />
      <div className="flex items-center gap-2">
        <button
          onClick={start}
          disabled={loading || !propertyId.trim() || done}
          className="inline-flex items-center gap-1.5 rounded bg-violet-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-400 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : done ? <CheckCircle2 className="h-3 w-3" /> : null}
          {done ? "Started!" : "Start"}
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
      </div>
    </div>
  );
}
