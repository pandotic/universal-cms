"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Textarea,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Select,
  Switch,
} from "@pandotic/universal-cms/components/ui";
import {
  Settings,
  Globe,
  Search,
  Share2,
  BarChart3,
  Shield,
  Save,
  Plus,
  Trash2,
} from "lucide-react";

interface GeneralSettings {
  site_name: string;
  site_url: string;
  site_description: string;
  tagline: string;
}

interface SeoSettings {
  meta_title_template: string;
  meta_description: string;
  og_image: string;
}

interface SocialSettings {
  twitter: string;
  linkedin: string;
  github: string;
  youtube: string;
}

interface AnalyticsProviderEntry {
  provider: string;
  config: Record<string, string>;
  enabled: boolean;
  scope?: "all" | "marketing";
}

interface WebmasterSettings {
  google: string;
  bing: string;
  yandex: string;
}

interface AllSettings {
  general: GeneralSettings;
  seo: SeoSettings;
  social: SocialSettings;
  analytics_providers: AnalyticsProviderEntry[];
  webmaster_verification: WebmasterSettings;
}

const DEFAULT_SETTINGS: AllSettings = {
  general: { site_name: "", site_url: "", site_description: "", tagline: "" },
  seo: { meta_title_template: "%s | Site Name", meta_description: "", og_image: "" },
  social: { twitter: "", linkedin: "", github: "", youtube: "" },
  analytics_providers: [],
  webmaster_verification: { google: "", bing: "", yandex: "" },
};

const PROVIDER_LABELS: Record<string, string> = {
  ga4: "Google Analytics 4",
  gtm: "Google Tag Manager",
  posthog: "PostHog",
  rybbit: "Rybbit Analytics",
  clarity: "Microsoft Clarity",
  linkedin: "LinkedIn Insight Tag",
  meta_pixel: "Meta / Facebook Pixel",
  cloudflare: "Cloudflare Web Analytics",
  custom: "Custom Script",
};

/** Default scope for each provider type */
const PROVIDER_DEFAULT_SCOPE: Record<string, "all" | "marketing"> = {
  posthog: "all",
  clarity: "all",
  rybbit: "all",
  ga4: "marketing",
  gtm: "marketing",
  linkedin: "marketing",
  meta_pixel: "marketing",
  cloudflare: "marketing",
  custom: "marketing",
};

const PROVIDER_FIELDS: Record<string, { key: string; label: string; placeholder: string }[]> = {
  ga4: [{ key: "measurement_id", label: "Measurement ID", placeholder: "G-XXXXXXXXXX" }],
  gtm: [{ key: "container_id", label: "Container ID", placeholder: "GTM-XXXXXXX" }],
  posthog: [
    { key: "api_key", label: "Project API Key", placeholder: "phc_XXXXXXXXXXXX" },
    { key: "host", label: "Host (optional)", placeholder: "https://us.i.posthog.com" },
  ],
  rybbit: [
    { key: "site_id", label: "Site ID", placeholder: "Your Rybbit site ID" },
    { key: "host", label: "Host (optional)", placeholder: "https://app.rybbit.io" },
  ],
  clarity: [{ key: "project_id", label: "Project ID", placeholder: "Your Clarity project ID" }],
  linkedin: [{ key: "partner_id", label: "Partner ID", placeholder: "Your LinkedIn partner ID" }],
  meta_pixel: [{ key: "pixel_id", label: "Pixel ID", placeholder: "Your Meta Pixel ID" }],
  cloudflare: [{ key: "beacon_token", label: "Beacon Token", placeholder: "Your Cloudflare beacon token" }],
  custom: [
    { key: "script_url", label: "Script URL (HTTPS)", placeholder: "https://example.com/script.js" },
    { key: "inline_script", label: "Inline Script", placeholder: "console.log('loaded');" },
  ],
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AllSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          // json.data is an array of SiteSetting rows — merge into our state
          const merged = { ...DEFAULT_SETTINGS };
          const rows = Array.isArray(json.data) ? json.data : [];
          for (const row of rows) {
            if (row.key === "site_name" && typeof row.value === "string") {
              merged.general.site_name = row.value;
            } else if (row.key === "site_url" && typeof row.value === "string") {
              merged.general.site_url = row.value;
            } else if (row.key === "site_description" && typeof row.value === "string") {
              merged.general.site_description = row.value;
            } else if (row.key === "tagline" && typeof row.value === "string") {
              merged.general.tagline = row.value;
            } else if (row.key === "seo" && typeof row.value === "object") {
              merged.seo = { ...merged.seo, ...row.value };
            } else if (row.key === "social_handles" && typeof row.value === "object") {
              merged.social = { ...merged.social, ...row.value };
            } else if (row.key === "analytics_providers") {
              const val = row.value;
              if (Array.isArray(val)) {
                merged.analytics_providers = val;
              } else if (val && typeof val === "object" && Array.isArray(val.providers)) {
                merged.analytics_providers = val.providers;
              }
            } else if (row.key === "webmaster_verification" && typeof row.value === "object" && !Array.isArray(row.value)) {
              merged.webmaster_verification = { ...merged.webmaster_verification, ...row.value };
            }
          }
          setSettings(merged);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function saveSection(section: string) {
    setSaving(section);

    let payload: { key: string; value: unknown }[];

    if (section === "general") {
      payload = [
        { key: "site_name", value: settings.general.site_name },
        { key: "site_url", value: settings.general.site_url },
        { key: "site_description", value: settings.general.site_description },
        { key: "tagline", value: settings.general.tagline },
      ];
    } else if (section === "seo") {
      payload = [{ key: "seo", value: settings.seo }];
    } else if (section === "social") {
      payload = [{ key: "social_handles", value: settings.social }];
    } else if (section === "analytics") {
      payload = [{ key: "analytics_providers", value: settings.analytics_providers }];
    } else if (section === "webmaster") {
      payload = [{ key: "webmaster_verification", value: settings.webmaster_verification }];
    } else {
      return;
    }

    fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: payload }),
    })
      .catch(() => {})
      .finally(() => setSaving(null));
  }

  function updateGeneral<K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, [key]: value },
    }));
  }

  function updateSeo<K extends keyof SeoSettings>(key: K, value: SeoSettings[K]) {
    setSettings((prev) => ({
      ...prev,
      seo: { ...prev.seo, [key]: value },
    }));
  }

  function updateSocial<K extends keyof SocialSettings>(key: K, value: SocialSettings[K]) {
    setSettings((prev) => ({
      ...prev,
      social: { ...prev.social, [key]: value },
    }));
  }

  function updateWebmaster<K extends keyof WebmasterSettings>(key: K, value: string) {
    setSettings((prev) => ({
      ...prev,
      webmaster_verification: { ...prev.webmaster_verification, [key]: value },
    }));
  }

  // Analytics provider management
  function addProvider() {
    setSettings((prev) => ({
      ...prev,
      analytics_providers: [
        ...prev.analytics_providers,
        { provider: "ga4", config: {}, enabled: true, scope: PROVIDER_DEFAULT_SCOPE["ga4"] },
      ],
    }));
  }

  function removeProvider(index: number) {
    setSettings((prev) => ({
      ...prev,
      analytics_providers: prev.analytics_providers.filter((_, i) => i !== index),
    }));
  }

  function updateProvider(index: number, field: string, value: unknown) {
    setSettings((prev) => ({
      ...prev,
      analytics_providers: prev.analytics_providers.map((p, i) => {
        if (i !== index) return p;
        if (field === "provider") {
          const newProvider = value as string;
          return { ...p, provider: newProvider, config: {}, scope: PROVIDER_DEFAULT_SCOPE[newProvider] || "marketing" };
        }
        if (field === "enabled") return { ...p, enabled: value as boolean };
        if (field === "scope") return { ...p, scope: value as "all" | "marketing" };
        return p;
      }),
    }));
  }

  function updateProviderConfig(index: number, configKey: string, value: string) {
    setSettings((prev) => ({
      ...prev,
      analytics_providers: prev.analytics_providers.map((p, i) =>
        i === index ? { ...p, config: { ...p.config, [configKey]: value } } : p
      ),
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-foreground-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-foreground-secondary">
          Configure your site settings, SEO, social links, analytics, and webmaster tools.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            <Globe className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="mr-2 h-4 w-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="mr-2 h-4 w-4" />
            Social
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="webmaster">
            <Shield className="mr-2 h-4 w-4" />
            Webmaster
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic information about your site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  value={settings.general.site_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateGeneral("site_name", e.target.value)
                  }
                  placeholder="My Website"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="site-url">Site URL</Label>
                <Input
                  id="site-url"
                  value={settings.general.site_url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateGeneral("site_url", e.target.value)
                  }
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="site-description">Site Description</Label>
                <Textarea
                  id="site-description"
                  value={settings.general.site_description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateGeneral("site_description", e.target.value)
                  }
                  placeholder="A brief description of your site"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={settings.general.tagline}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateGeneral("tagline", e.target.value)
                  }
                  placeholder="Your catchy tagline"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border pt-4">
              <Button
                onClick={() => saveSection("general")}
                disabled={saving === "general"}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving === "general" ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Configure meta tags and Open Graph defaults.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="meta-title-template">Meta Title Template</Label>
                <Input
                  id="meta-title-template"
                  value={settings.seo.meta_title_template}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateSeo("meta_title_template", e.target.value)
                  }
                  placeholder="%s | Site Name"
                />
                <p className="text-xs text-foreground-tertiary">
                  Use %s as a placeholder for the page title.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meta-description">Default Meta Description</Label>
                <Textarea
                  id="meta-description"
                  value={settings.seo.meta_description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateSeo("meta_description", e.target.value)
                  }
                  placeholder="Default description used when pages don't specify one"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="og-image">Default OG Image URL</Label>
                <Input
                  id="og-image"
                  value={settings.seo.og_image}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateSeo("og_image", e.target.value)
                  }
                  placeholder="https://example.com/og-image.png"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border pt-4">
              <Button
                onClick={() => saveSection("seo")}
                disabled={saving === "seo"}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving === "seo" ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>
                Connect your social media profiles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="twitter">Twitter / X</Label>
                <Input
                  id="twitter"
                  value={settings.social.twitter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateSocial("twitter", e.target.value)
                  }
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={settings.social.linkedin}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateSocial("linkedin", e.target.value)
                  }
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  value={settings.social.github}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateSocial("github", e.target.value)
                  }
                  placeholder="https://github.com/yourorg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  value={settings.social.youtube}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateSocial("youtube", e.target.value)
                  }
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border pt-4">
              <Button
                onClick={() => saveSection("social")}
                disabled={saving === "social"}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving === "social" ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Analytics Tab — Multi-Provider */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics &amp; Tracking</CardTitle>
              <CardDescription>
                Configure one or more analytics and tracking providers. Use the scope setting
                to control whether a tag fires on all pages or only on the marketing site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.analytics_providers.length === 0 && (
                <p className="text-sm text-foreground-tertiary py-4 text-center">
                  No tracking providers configured. Click &quot;Add Provider&quot; to get started.
                </p>
              )}

              {settings.analytics_providers.map((provider, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Select
                        value={provider.provider}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          updateProvider(index, "provider", e.target.value)
                        }
                      >
                        {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={provider.enabled}
                          onCheckedChange={(checked: boolean) =>
                            updateProvider(index, "enabled", checked)
                          }
                        />
                        <span className="text-xs text-foreground-tertiary">
                          {provider.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProvider(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <Label className="text-xs whitespace-nowrap">Scope</Label>
                    <Select
                      value={provider.scope || PROVIDER_DEFAULT_SCOPE[provider.provider] || "marketing"}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        updateProvider(index, "scope", e.target.value)
                      }
                    >
                      <option value="all">All pages (app + marketing)</option>
                      <option value="marketing">Marketing site only</option>
                    </Select>
                  </div>

                  {(PROVIDER_FIELDS[provider.provider] ?? []).map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label>{field.label}</Label>
                      {field.key === "inline_script" ? (
                        <Textarea
                          value={(provider.config[field.key] as string) ?? ""}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            updateProviderConfig(index, field.key, e.target.value)
                          }
                          placeholder={field.placeholder}
                          rows={3}
                        />
                      ) : (
                        <Input
                          value={(provider.config[field.key] as string) ?? ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateProviderConfig(index, field.key, e.target.value)
                          }
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}

              <Button variant="outline" onClick={addProvider}>
                <Plus className="mr-2 h-4 w-4" />
                Add Provider
              </Button>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border pt-4">
              <Button
                onClick={() => saveSection("analytics")}
                disabled={saving === "analytics"}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving === "analytics" ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Webmaster Verification Tab */}
        <TabsContent value="webmaster">
          <Card>
            <CardHeader>
              <CardTitle>Webmaster Verification</CardTitle>
              <CardDescription>
                Add verification codes for search engine webmaster tools. These are rendered
                as meta tags in your site&apos;s &lt;head&gt;.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="wm-google">Google Search Console</Label>
                <Input
                  id="wm-google"
                  value={settings.webmaster_verification.google}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateWebmaster("google", e.target.value)
                  }
                  placeholder="Verification code from Google Search Console"
                />
                <p className="text-xs text-foreground-tertiary">
                  The content value from your google-site-verification meta tag.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wm-bing">Bing Webmaster Tools</Label>
                <Input
                  id="wm-bing"
                  value={settings.webmaster_verification.bing}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateWebmaster("bing", e.target.value)
                  }
                  placeholder="Verification code from Bing Webmaster"
                />
                <p className="text-xs text-foreground-tertiary">
                  The content value from your msvalidate.01 meta tag.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wm-yandex">Yandex Webmaster</Label>
                <Input
                  id="wm-yandex"
                  value={settings.webmaster_verification.yandex}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateWebmaster("yandex", e.target.value)
                  }
                  placeholder="Verification code from Yandex Webmaster"
                />
                <p className="text-xs text-foreground-tertiary">
                  The content value from your yandex-verification meta tag.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border pt-4">
              <Button
                onClick={() => saveSection("webmaster")}
                disabled={saving === "webmaster"}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving === "webmaster" ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
