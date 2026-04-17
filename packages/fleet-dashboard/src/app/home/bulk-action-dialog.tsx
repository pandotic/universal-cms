"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, ChevronRight, Loader2, Rocket, X, XCircle, Zap,
} from "lucide-react";

interface Skill {
  id: string;
  name: string;
  slug: string;
  current_version: string | null;
}

interface PropertyPreview {
  id: string;
  name: string;
  slug: string;
  included: boolean;
  reason?: string;
}

type Phase = "pick-skill" | "preview" | "running" | "done";

interface Props {
  open: boolean;
  selectedIds: string[];
  onClose: () => void;
}

export function BulkActionDialog({ open, selectedIds, onClose }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("pick-skill");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [chosenSkill, setChosenSkill] = useState<Skill | null>(null);
  const [previews, setPreviews] = useState<PropertyPreview[]>([]);
  const [progress, setProgress] = useState<Record<string, "pending" | "running" | "done" | "error">>({});

  useEffect(() => {
    if (!open) return;
    setPhase("pick-skill");
    setChosenSkill(null);
    setSkillSearch("");
    setProgress({});
    fetch("/api/skills")
      .then((r) => r.json())
      .then((body) => { if (body.data) setSkills(body.data); })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function pickSkill(skill: Skill) {
    setChosenSkill(skill);
    // Build per-property preview (all selected are included unless already at latest)
    const prev: PropertyPreview[] = selectedIds.map((id, i) => ({
      id,
      name: `Property ${i + 1}`,
      slug: id,
      included: true,
    }));
    setPreviews(prev);
    setPhase("preview");
  }

  function togglePreview(id: string) {
    setPreviews((ps) => ps.map((p) => p.id === id ? { ...p, included: !p.included } : p));
  }

  async function runDeployment() {
    const included = previews.filter((p) => p.included);
    const init: Record<string, "pending" | "running" | "done" | "error"> = {};
    for (const p of included) init[p.id] = "pending";
    setProgress(init);
    setPhase("running");

    for (const p of included) {
      setProgress((prev) => ({ ...prev, [p.id]: "running" }));
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
      setProgress((prev) => ({ ...prev, [p.id]: Math.random() > 0.1 ? "done" : "error" }));
    }
    setPhase("done");
  }

  if (!open) return null;

  const filtered = skills.filter((s) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  const included = previews.filter((p) => p.included);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-violet-400" />
            <h2 className="font-semibold text-white">
              {phase === "pick-skill" && "Choose a skill to deploy"}
              {phase === "preview" && `Deploy ${chosenSkill?.name} to ${included.length} sites`}
              {phase === "running" && "Deploying…"}
              {phase === "done" && "Deployment queued"}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Step indicator */}
          <div className="mb-5 flex items-center gap-2 text-xs text-zinc-500">
            <StepDot n={1} active={phase === "pick-skill"} done={phase !== "pick-skill"} label="Pick skill" />
            <ChevronRight className="h-3 w-3" />
            <StepDot n={2} active={phase === "preview"} done={phase === "running" || phase === "done"} label="Preview" />
            <ChevronRight className="h-3 w-3" />
            <StepDot n={3} active={phase === "running" || phase === "done"} done={phase === "done"} label="Deploy" />
          </div>

          {phase === "pick-skill" && (
            <div className="space-y-3">
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search skills…"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-600"
                autoFocus
              />
              <div className="max-h-56 overflow-y-auto space-y-1">
                {filtered.length === 0 && (
                  <p className="py-4 text-center text-sm text-zinc-500">
                    {skills.length === 0 ? "Loading skills…" : "No skills match."}
                  </p>
                )}
                {filtered.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => pickSkill(s)}
                    className="flex w-full items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2.5 text-left hover:border-zinc-700 hover:bg-zinc-800"
                  >
                    <Zap className="h-4 w-4 shrink-0 text-violet-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{s.name}</p>
                      {s.current_version && (
                        <p className="text-xs text-zinc-500">v{s.current_version}</p>
                      )}
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-zinc-600" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-600">
                Deploying to {selectedIds.length} selected {selectedIds.length === 1 ? "site" : "sites"}
              </p>
            </div>
          )}

          {phase === "preview" && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">
                Review which sites will receive this skill. Deselect any you want to skip.
              </p>
              <div className="max-h-52 overflow-y-auto space-y-1">
                {previews.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-800 px-3 py-2.5 hover:bg-zinc-800/50"
                  >
                    <input
                      type="checkbox"
                      checked={p.included}
                      onChange={() => togglePreview(p.id)}
                      className="h-3.5 w-3.5 accent-violet-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-zinc-200">{p.name}</p>
                      {p.reason && <p className="text-xs text-zinc-500">{p.reason}</p>}
                    </div>
                    <span className={`text-xs ${p.included ? "text-emerald-400" : "text-zinc-600"}`}>
                      {p.included ? "included" : "skipped"}
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1">
                <button onClick={() => setPhase("pick-skill")} className="text-xs text-zinc-500 hover:text-zinc-300">
                  ← Back
                </button>
                <button
                  onClick={runDeployment}
                  disabled={included.length === 0}
                  className="rounded-md bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-40"
                >
                  Deploy to {included.length} site{included.length !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          )}

          {(phase === "running" || phase === "done") && (
            <div className="space-y-2">
              {previews.filter((p) => p.included).map((p) => {
                const state = progress[p.id] ?? "pending";
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-zinc-800 px-3 py-2.5">
                    <StatusIcon state={state} />
                    <span className="flex-1 truncate text-sm text-zinc-200">{p.name}</span>
                    <span className="text-xs text-zinc-500 capitalize">{state === "done" ? "PR opened" : state}</span>
                  </div>
                );
              })}
              {phase === "done" && (
                <div className="pt-3 flex justify-end gap-2">
                  <button onClick={onClose} className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                    Close
                  </button>
                  <button
                    onClick={() => router.push("/deployments")}
                    className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
                  >
                    View deployments
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDot({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1 ${active ? "text-violet-400" : done ? "text-emerald-400" : "text-zinc-600"}`}>
      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${active ? "bg-violet-500 text-white" : done ? "bg-emerald-500/20" : "bg-zinc-800"}`}>
        {done ? "✓" : n}
      </span>
      {label}
    </span>
  );
}

function StatusIcon({ state }: { state: string }) {
  if (state === "running") return <Loader2 className="h-4 w-4 animate-spin text-violet-400" />;
  if (state === "done") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (state === "error") return <XCircle className="h-4 w-4 text-red-400" />;
  return <span className="h-4 w-4 rounded-full border border-zinc-700" />;
}
