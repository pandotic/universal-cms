"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Check, Sparkles, Star, Trash2, Loader2 } from "lucide-react";
import { optimizePrompt } from "@pandotic/universal-cms/promptkit/optimizers";
import {
  MODELS,
  LLM_META,
  getModelMeta,
} from "@pandotic/universal-cms/promptkit/models";
import type {
  LLMProvider,
  ModelId,
  PromptTone,
  OutputMode,
  OptimizationResult,
} from "@pandotic/universal-cms/types/promptkit";

interface HistoryRow {
  id: string;
  provider: LLMProvider;
  model_id: string;
  model_label: string | null;
  raw_prompt: string;
  optimized_prompt: string;
  notes: string[];
  tone: PromptTone;
  output_mode: OutputMode;
  is_favorite: boolean;
  label: string | null;
  created_at: string;
}

const PROVIDERS: LLMProvider[] = ["claude", "gemini", "openai"];
const TONES: { id: PromptTone; label: string; hint: string }[] = [
  { id: "direct", label: "Direct", hint: "Strip pleasantries" },
  { id: "thorough", label: "Thorough", hint: "Explain reasoning" },
  { id: "collaborative", label: "Collaborative", hint: "Ask for clarification" },
  { id: "aggressive", label: "Aggressive", hint: "Challenge approach" },
];

export default function PromptKitPage() {
  const [provider, setProvider] = useState<LLMProvider>("claude");
  const [modelId, setModelId] = useState<ModelId>(LLM_META.claude.defaultModel);
  const [tone, setTone] = useState<PromptTone>("direct");
  const [outputMode, setOutputMode] = useState<OutputMode>("single");
  const [rawPrompt, setRawPrompt] = useState("");
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const models = useMemo(() => MODELS[provider], [provider]);
  const modelMeta = useMemo(
    () => getModelMeta(provider, modelId),
    [provider, modelId]
  );

  // Reset model when provider changes, but only if current model isn't valid for new provider
  useEffect(() => {
    const valid = MODELS[provider].some((m) => m.id === modelId);
    if (!valid) setModelId(LLM_META[provider].defaultModel);
  }, [provider, modelId]);

  useEffect(() => {
    fetch("/api/promptkit/history?limit=20")
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((d) => setHistory(d.entries ?? []))
      .catch(() => setHistory([]));
  }, []);

  async function handleOptimize() {
    if (!rawPrompt.trim()) return;

    const opt = optimizePrompt({
      mode: "quick",
      target: { provider, model: modelId },
      rawPrompt,
      tone,
      outputMode,
    });
    setResult(opt);
    setCopied(false);

    // Save to history
    const optimizedText = Array.isArray(opt.prompt)
      ? opt.prompt.join("\n\n---\n\n")
      : opt.prompt;

    setSaving(true);
    try {
      const res = await fetch("/api/promptkit/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model_id: modelId,
          model_label: modelMeta?.label,
          raw_prompt: rawPrompt,
          optimized_prompt: optimizedText,
          notes: opt.notes,
          tone,
          output_mode: outputMode,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setHistory((prev) => [data, ...prev].slice(0, 20));
      }
    } catch {
      // Silent fail — optimization still works even if save fails
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    const text = Array.isArray(result.prompt)
      ? result.prompt.join("\n\n---\n\n")
      : result.prompt;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleToggleFavorite(id: string, current: boolean) {
    const res = await fetch(`/api/promptkit/history/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: !current }),
    });
    if (res.ok) {
      setHistory((prev) =>
        prev.map((h) => (h.id === id ? { ...h, is_favorite: !current } : h))
      );
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/promptkit/history/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setHistory((prev) => prev.filter((h) => h.id !== id));
    }
  }

  function loadFromHistory(row: HistoryRow) {
    setProvider(row.provider);
    setModelId(row.model_id);
    setTone(row.tone);
    setOutputMode(row.output_mode);
    setRawPrompt(row.raw_prompt);
    setResult({
      prompt: row.optimized_prompt,
      mode: row.output_mode,
      notes: row.notes,
    });
    setHistoryOpen(false);
  }

  const optimizedText = result
    ? Array.isArray(result.prompt)
      ? result.prompt.join("\n\n---\n\n")
      : result.prompt
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            &larr; Back to Hub
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              PromptKit
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Right-click to enhance · Rule-based optimizer for Claude, Gemini,
            ChatGPT
          </p>
        </div>
        <button
          onClick={() => setHistoryOpen((o) => !o)}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          History ({history.length})
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Input column */}
        <div className="space-y-4">
          {/* Provider selector */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Target AI
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map((p) => {
                const meta = LLM_META[p];
                const active = provider === p;
                return (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                      active
                        ? "border-white/30 bg-zinc-800 text-white"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <span className="mr-1.5" style={{ color: meta.accentColor }}>
                      {meta.icon}
                    </span>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model picker */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Model
            </label>
            <div className="space-y-1.5">
              {models.map((m) => {
                const active = modelId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setModelId(m.id)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? "border-white/30 bg-zinc-800 text-white"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{m.label}</span>
                      <span className="text-xs text-zinc-500">
                        {m.contextWindow}
                      </span>
                    </span>
                    {m.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          m.tier === "flagship"
                            ? "bg-amber-500/10 text-amber-300"
                            : m.tier === "balanced"
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {m.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Tone
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((t) => {
                const active = tone === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`rounded-md border px-3 py-2 text-left transition-colors ${
                      active
                        ? "border-white/30 bg-zinc-800"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                    }`}
                  >
                    <div
                      className={`text-sm ${active ? "text-white" : "text-zinc-300"}`}
                    >
                      {t.label}
                    </div>
                    <div className="text-xs text-zinc-500">{t.hint}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Output mode */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Output
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOutputMode("single")}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                  outputMode === "single"
                    ? "border-white/30 bg-zinc-800 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                Single
              </button>
              <button
                onClick={() => setOutputMode("phased")}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                  outputMode === "phased"
                    ? "border-white/30 bg-zinc-800 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                Phased (3 stages)
              </button>
            </div>
          </div>

          {/* Raw prompt */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Your rough prompt
            </label>
            <textarea
              value={rawPrompt}
              onChange={(e) => setRawPrompt(e.target.value)}
              placeholder="Paste your rough prompt here — we'll enhance it for your chosen model..."
              rows={8}
              className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <button
            onClick={handleOptimize}
            disabled={!rawPrompt.trim() || saving}
            className="w-full rounded-md bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Optimizing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                Enhance prompt
              </span>
            )}
          </button>
        </div>

        {/* Output column */}
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Optimized prompt
              </label>
              {result && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="min-h-[280px] rounded-md border border-zinc-800 bg-zinc-950 p-3">
              {result ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-sm text-zinc-200">
                  {optimizedText}
                </pre>
              ) : (
                <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-zinc-600">
                  Enhanced prompt will appear here
                </div>
              )}
            </div>
          </div>

          {result && result.notes.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Changes ({result.notes.length})
              </label>
              <ul className="space-y-1.5 rounded-md border border-zinc-800 bg-zinc-950 p-3">
                {result.notes.map((note, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-xs text-zinc-400"
                  >
                    <span className="text-emerald-400">+</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* History drawer */}
      {historyOpen && (
        <>
          <div
            onClick={() => setHistoryOpen(false)}
            className="fixed inset-0 z-40 bg-black/60"
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 p-4">
              <h2 className="text-sm font-semibold text-white">
                History ({history.length})
              </h2>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {history.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-600">
                  No history yet. Optimize a prompt to save it here.
                </div>
              ) : (
                <ul className="space-y-2">
                  {history.map((h) => (
                    <li
                      key={h.id}
                      className="group rounded-md border border-zinc-800 bg-zinc-900/50 p-3 hover:border-zinc-700"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => loadFromHistory(h)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span
                              style={{
                                color: LLM_META[h.provider].accentColor,
                              }}
                            >
                              {LLM_META[h.provider].icon}
                            </span>
                            <span>{h.model_label ?? h.model_id}</span>
                            <span>·</span>
                            <span>{h.tone}</span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-200">
                            {h.raw_prompt}
                          </p>
                          <p className="mt-1 text-[10px] text-zinc-600">
                            {new Date(h.created_at).toLocaleString()}
                          </p>
                        </button>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() =>
                              handleToggleFavorite(h.id, h.is_favorite)
                            }
                            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-amber-400"
                            title={h.is_favorite ? "Unfavorite" : "Favorite"}
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${h.is_favorite ? "fill-amber-400 text-amber-400" : ""}`}
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(h.id)}
                            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
