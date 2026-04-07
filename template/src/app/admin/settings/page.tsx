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
  Save,
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

interface AnalyticsSettings {
  provider: "none" | "ga4" | "gtm" | "posthog" | "custom";
  measurement_id: string;
  enabled: boolean;
}

interface AllSettings {
  general: GeneralSettings;
  seo: SeoSettings;
  social: SocialSettings;
  analytics: AnalyticsSettings;
}

const DEFAULT_SETTINGS: AllSettings = {
  general: { site_name: "", site_url: "", site_description: "", tagline: "" },
  seo: { meta_title_template: "%s | Site Name", meta_description: "", og_image: "" },
  social: { twitter: "", linkedin: "", github: "", youtube: "" },
  analytics: { provider: "none", measurement_id: "", enabled: false },
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
          setSettings((prev) => ({ ...prev, ...json.data }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function saveSection(section: keyof AllSettings) {
    setSaving(section);
    fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [section]: settings[section] }),
    })
      .catch(() => {})
      .finally(() => setSaving(null));
  }

  function updateGeneral<K extends keyof GeneralSettings>(
    key: K,
    value: GeneralSettings[K]
  ) {
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

  function updateSocial<K extends keyof SocialSettings>(
    key: K,
    value: SocialSettings[K]
  ) {
    setSettings((prev) => ({
      ...prev,
      social: { ...prev.social, [key]: value },
    }));
  }

  function updateAnalytics<K extends keyof AnalyticsSettings>(
    key: K,
    value: AnalyticsSettings[K]
  ) {
    setSettings((prev) => ({
      ...prev,
      analytics: { ...prev.analytics, [key]: value },
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
          Configure your site settings, SEO, social links, and analytics.
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

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Configure analytics tracking for your site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Analytics</Label>
                  <p className="text-xs text-foreground-tertiary">
                    Toggle analytics tracking on or off.
                  </p>
                </div>
                <Switch
                  checked={settings.analytics.enabled}
                  onCheckedChange={(checked: boolean) =>
                    updateAnalytics("enabled", checked)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="analytics-provider">Provider</Label>
                <Select
                  id="analytics-provider"
                  value={settings.analytics.provider}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    updateAnalytics(
                      "provider",
                      e.target.value as AnalyticsSettings["provider"]
                    )
                  }
                >
                  <option value="none">None</option>
                  <option value="ga4">Google Analytics 4</option>
                  <option value="gtm">Google Tag Manager</option>
                  <option value="posthog">PostHog</option>
                  <option value="custom">Custom</option>
                </Select>
              </div>
              {settings.analytics.provider !== "none" && (
                <div className="space-y-1.5">
                  <Label htmlFor="measurement-id">
                    {settings.analytics.provider === "ga4"
                      ? "Measurement ID"
                      : settings.analytics.provider === "gtm"
                        ? "Container ID"
                        : settings.analytics.provider === "posthog"
                          ? "Project API Key"
                          : "Tracking ID"}
                  </Label>
                  <Input
                    id="measurement-id"
                    value={settings.analytics.measurement_id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateAnalytics("measurement_id", e.target.value)
                    }
                    placeholder={
                      settings.analytics.provider === "ga4"
                        ? "G-XXXXXXXXXX"
                        : settings.analytics.provider === "gtm"
                          ? "GTM-XXXXXXX"
                          : settings.analytics.provider === "posthog"
                            ? "phc_XXXXXXXXXXXX"
                            : "Your tracking ID"
                    }
                  />
                </div>
              )}
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
      </Tabs>
    </div>
  );
}
