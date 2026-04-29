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

interface SeoDefaults {
  default_title_template: string;
  default_description: string;
  default_og_image: string;
  twitter_handle: string;
  organization_name: string;
  organization_url: string;
  organization_logo: string;
  robots_extra: string;
  sitemap_enabled: boolean;
}

interface WebmasterCodes {
  google: string;
  bing: string;
  yandex: string;
}

const DEFAULT_SEO: SeoDefaults = {
  default_title_template: "%s",
  default_description: "",
  default_og_image: "",
  twitter_handle: "",
  organization_name: "",
  organization_url: "",
  organization_logo: "",
  robots_extra: "",
  sitemap_enabled: true,
};

const DEFAULT_VERIFICATION: WebmasterCodes = {
  google: "",
  bing: "",
  yandex: "",
};

export interface SEOPanelProps {
  supabase: SupabaseClient;
}

/**
 * Site-wide SEO defaults — fallbacks for pages that don't set their own,
 * organization JSON-LD, robots.txt extras, and webmaster verification
 * codes. Per-page overrides live on the content page itself; this is the
 * default-of-defaults.
 *
 * Stored under two `site_settings` keys: `seo_defaults` and
 * `webmaster_verification`.
 */
export function SEOPanel({ supabase }: SEOPanelProps) {
  const [seo, setSeo] = useState<SeoDefaults>(DEFAULT_SEO);
  const [verification, setVerification] =
    useState<WebmasterCodes>(DEFAULT_VERIFICATION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [seoRaw, verRaw] = await Promise.all([
        getSetting(supabase, "seo_defaults"),
        getSetting(supabase, "webmaster_verification"),
      ]);
      if (isObject(seoRaw)) {
        setSeo({
          default_title_template: stringField(
            seoRaw.default_title_template,
            DEFAULT_SEO.default_title_template,
          ),
          default_description: stringField(seoRaw.default_description),
          default_og_image: stringField(seoRaw.default_og_image),
          twitter_handle: stringField(seoRaw.twitter_handle),
          organization_name: stringField(seoRaw.organization_name),
          organization_url: stringField(seoRaw.organization_url),
          organization_logo: stringField(seoRaw.organization_logo),
          robots_extra: stringField(seoRaw.robots_extra),
          sitemap_enabled: boolField(
            seoRaw.sitemap_enabled,
            DEFAULT_SEO.sitemap_enabled,
          ),
        });
      }
      if (isObject(verRaw)) {
        setVerification({
          google: stringField(verRaw.google),
          bing: stringField(verRaw.bing),
          yandex: stringField(verRaw.yandex),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load SEO settings");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function setSeoField<K extends keyof SeoDefaults>(
    key: K,
    value: SeoDefaults[K],
  ) {
    setSeo((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  }

  function setVerField<K extends keyof WebmasterCodes>(
    key: K,
    value: WebmasterCodes[K],
  ) {
    setVerification((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await Promise.all([
        updateSetting(
          supabase,
          "seo_defaults",
          seo as unknown as Record<string, unknown>,
        ),
        updateSetting(
          supabase,
          "webmaster_verification",
          verification as unknown as Record<string, unknown>,
        ),
      ]);
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
        title="SEO"
        description="Site-wide defaults. Per-page SEO overrides live on each content page."
      />
      <PanelError message={error} />
      {message && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-sm text-emerald-400">{message}</p>
        </div>
      )}

      <Section title="Defaults">
        <div className="space-y-4">
          <Field
            label="Title template"
            help={"Use %s to interpolate the page title. e.g. “%s | Acme”."}
          >
            <input
              type="text"
              value={seo.default_title_template}
              onChange={(e) =>
                setSeoField("default_title_template", e.target.value)
              }
              className={inputClass}
            />
          </Field>
          <Field label="Default meta description">
            <textarea
              value={seo.default_description}
              onChange={(e) =>
                setSeoField("default_description", e.target.value)
              }
              rows={3}
              className={inputClass}
            />
          </Field>
          <Field label="Default OG image URL">
            <input
              type="url"
              value={seo.default_og_image}
              onChange={(e) => setSeoField("default_og_image", e.target.value)}
              placeholder="https://…/og.png"
              className={inputClass}
            />
          </Field>
          <Field label="Twitter handle" help="Without the @ — used for Twitter cards.">
            <input
              type="text"
              value={seo.twitter_handle}
              onChange={(e) => setSeoField("twitter_handle", e.target.value)}
              placeholder="pandotic"
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section title="Organization (schema.org)">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Organization name">
            <input
              type="text"
              value={seo.organization_name}
              onChange={(e) =>
                setSeoField("organization_name", e.target.value)
              }
              className={inputClass}
            />
          </Field>
          <Field label="Organization URL">
            <input
              type="url"
              value={seo.organization_url}
              onChange={(e) => setSeoField("organization_url", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Organization logo URL">
          <input
            type="url"
            value={seo.organization_logo}
            onChange={(e) => setSeoField("organization_logo", e.target.value)}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Crawling">
        <Field
          label="robots.txt extras"
          help="Appended to your robots.txt — one rule per line."
        >
          <textarea
            value={seo.robots_extra}
            onChange={(e) => setSeoField("robots_extra", e.target.value)}
            rows={4}
            className={`${inputClass} font-mono text-xs`}
            placeholder={"Disallow: /private\nAllow: /public"}
          />
        </Field>
        <label className="mt-3 flex items-center gap-2 text-sm text-foreground-secondary">
          <input
            type="checkbox"
            checked={seo.sitemap_enabled}
            onChange={(e) => setSeoField("sitemap_enabled", e.target.checked)}
            className="h-4 w-4 accent-foreground"
          />
          <span>Generate sitemap.xml automatically</span>
        </label>
      </Section>

      <Section title="Webmaster verification">
        <p className="mb-3 text-xs text-foreground-tertiary">
          Verification meta tags — paste just the content code, not the full
          tag.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Google">
            <input
              type="text"
              value={verification.google}
              onChange={(e) => setVerField("google", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Bing">
            <input
              type="text"
              value={verification.bing}
              onChange={(e) => setVerField("bing", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Yandex">
            <input
              type="text"
              value={verification.yandex}
              onChange={(e) => setVerField("yandex", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <div className="border-t border-border pt-4">
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save SEO settings"}
        </PrimaryButton>
      </div>
    </form>
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

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function stringField(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function boolField(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}
