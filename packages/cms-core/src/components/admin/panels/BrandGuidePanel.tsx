"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSetting,
  updateSetting,
} from "../../../data/site-settings.js";
import {
  Field,
  PanelError,
  PanelHeading,
  PanelSpinner,
  PrimaryButton,
  inputClass,
} from "./_shared.js";

interface BrandGuide {
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  voice_tone: string;
  logo_url: string;
  wordmark_url: string;
}

const DEFAULT: BrandGuide = {
  primary_color: "",
  accent_color: "",
  background_color: "",
  text_color: "",
  font_family: "",
  voice_tone: "",
  logo_url: "",
  wordmark_url: "",
};

export interface BrandGuidePanelProps {
  supabase: SupabaseClient;
}

/**
 * Brand guide — the site's visual identity stored in
 * `site_settings.brand_guide`. Single editable form; no list view.
 */
export function BrandGuidePanel({ supabase }: BrandGuidePanelProps) {
  const [draft, setDraft] = useState<BrandGuide>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const value = await getSetting(supabase, "brand_guide");
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const obj = value as Record<string, unknown>;
        setDraft({
          primary_color: stringField(obj.primary_color),
          accent_color: stringField(obj.accent_color),
          background_color: stringField(obj.background_color),
          text_color: stringField(obj.text_color),
          font_family: stringField(obj.font_family),
          voice_tone: stringField(obj.voice_tone),
          logo_url: stringField(obj.logo_url),
          wordmark_url: stringField(obj.wordmark_url),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load brand guide");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function set<K extends keyof BrandGuide>(key: K, value: BrandGuide[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateSetting(
        supabase,
        "brand_guide",
        draft as unknown as Record<string, unknown>,
      );
      setMessage("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PanelSpinner />;

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <PanelHeading
        title="Brand Guide"
        description="Logos, colors, typography, voice. Stored in site_settings.brand_guide."
      />
      <PanelError message={error} />
      {message && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-sm text-emerald-400">{message}</p>
        </div>
      )}

      <Section title="Identity">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Logo URL">
            <input
              type="url"
              value={draft.logo_url}
              onChange={(e) => set("logo_url", e.target.value)}
              placeholder="https://…/logo.svg"
              className={inputClass}
            />
          </Field>
          <Field label="Wordmark URL">
            <input
              type="url"
              value={draft.wordmark_url}
              onChange={(e) => set("wordmark_url", e.target.value)}
              placeholder="https://…/wordmark.svg"
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section title="Colors">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <ColorField
            label="Primary"
            value={draft.primary_color}
            onChange={(v) => set("primary_color", v)}
          />
          <ColorField
            label="Accent"
            value={draft.accent_color}
            onChange={(v) => set("accent_color", v)}
          />
          <ColorField
            label="Background"
            value={draft.background_color}
            onChange={(v) => set("background_color", v)}
          />
          <ColorField
            label="Text"
            value={draft.text_color}
            onChange={(v) => set("text_color", v)}
          />
        </div>
      </Section>

      <Section title="Typography & voice">
        <div className="space-y-4">
          <Field label="Font family">
            <input
              type="text"
              value={draft.font_family}
              onChange={(e) => set("font_family", e.target.value)}
              placeholder="Inter, system-ui, sans-serif"
              className={inputClass}
            />
          </Field>
          <Field
            label="Voice & tone"
            help="A short paragraph guiding writing across the site."
          >
            <textarea
              value={draft.voice_tone}
              onChange={(e) => set("voice_tone", e.target.value)}
              rows={5}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <div className="border-t border-border pt-4">
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save brand guide"}
        </PrimaryButton>
      </div>
    </form>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const looksLikeColor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-7 w-7 shrink-0 rounded border border-border"
          style={{ background: looksLikeColor ? value : "transparent" }}
          aria-hidden
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#0a0a0a"
          className={inputClass}
        />
      </div>
    </Field>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function stringField(v: unknown): string {
  return typeof v === "string" ? v : "";
}
