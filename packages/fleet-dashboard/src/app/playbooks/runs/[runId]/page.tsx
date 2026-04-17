"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Bot, CheckCircle2, Circle, Globe, Loader2, RefreshCcw, Rocket, Wrench } from "lucide-react";
import type { PlaybookRunWithProgress } from "@pandotic/universal-cms/types/playbooks";

const STEP_ICON: Record<string, React.ReactNode> = {
  deploy_skill: <Rocket className="h-4 w-4 text-violet-400" />,
  upgrade_cms: <RefreshCcw className="h-4 w-4 text-amber-400" />,
  run_agent: <Bot className="h-4 w-4 text-cyan-400" />,
  open_url: <Globe className="h-4 w-4 text-zinc-400" />,
  manual: <Wrench className="h-4 w-4 text-zinc-400" />,
};

export default function PlaybookRunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  const [run, setRun] = useState<PlaybookRunWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  async function load() {
    const r = await fetch(`/api/playbooks/runs/${runId}`);
    const body = await r.json() as { data?: PlaybookRunWithProgress };
    if (body.data) setRun(body.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [runId]);

  async function completeStep(stepId: string) {
    setCompleting(stepId);
    await fetch(`/api/playbooks/runs/${runId}/steps/${stepId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
    await load();
    setCompleting(null);
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />;
  }
  if (!run) {
    return <p className="text-sm text-zinc-500">Playbook run not found.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/playbooks" className="text-xs text-zinc-500 hover:text-zinc-300">← Playbooks</Link>
        <h1 className="mt-2 text-xl font-semibold text-white">{run.template.name}</h1>
        <p className="mt-1 text-sm text-zinc-400">{run.template.description}</p>
      </div>

      {/* Progress bar */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-300">Progress</span>
          <span className="font-semibold text-white">{run.progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-500"
            style={{ width: `${run.progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {run.steps.map((step, i) => {
          const done = step.status === "completed";
          const isCompleting = completing === step.id;
          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                done ? "border-emerald-500/20 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Circle className="h-5 w-5 text-zinc-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600 tabular-nums">{i + 1}.</span>
                  <span className={`text-sm font-medium ${done ? "text-zinc-400 line-through" : "text-white"}`}>
                    {step.template_step.title}
                  </span>
                  <span className="ml-1">{STEP_ICON[step.template_step.step_type] ?? null}</span>
                </div>
                {step.template_step.description && (
                  <p className="mt-1 text-xs text-zinc-500">{step.template_step.description}</p>
                )}
                {step.completed_at && (
                  <p className="mt-1 text-xs text-emerald-600">
                    Completed {new Date(step.completed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              {!done && (
                <button
                  onClick={() => completeStep(step.id)}
                  disabled={!!isCompleting}
                  className="shrink-0 rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
                >
                  {isCompleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark done"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
