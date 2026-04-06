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
  Separator,
} from "@/components/ui/shadcn";
import { cn } from "@/lib/utils";
import {
  Settings,
  Globe,
  Search,
  Share2,
  BarChart3,
  Scale,
  Save,
  Plus,
  Trash2,
  Code,
  Copy,
  Check,
} from "lucide-react";

type AnalyticsProvider = "ga4" | "gtm" | "meta-pixel" | "linkedin-insight" | "rybbit" | "posthog" | "custom";

interface AnalyticsEntry {
  id: string;
  provider: AnalyticsProvider;
  config: Record<string, string>;
  enabled: boolean;
}

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

interface LegalSettings {
  disclosure_text: string;
  terms_url: string;
  privacy_url: string;
}

const PROVIDER_LABELS: Record<AnalyticsProvider, string> = {
  ga4: "Google Analytics 4",
  gtm: "Google Tag Manager",
  "meta-pixel": "Meta Pixel",
  "linkedin-insight": "LinkedIn Insight",
  rybbit: "Rybbit",
  posthog: "PostHog",
  custom: "Custom",
};

const PROVIDER_CONFIG_FIELDS: Record<AnalyticsProvider, { key: string; label: string; placeholder: string }[]> = {
  ga4: [{ key: "measurement_id", label: "Measurement ID", placeholder: "G-XXXXXXXXXX" }],
  gtm: [{ key: "container_id", label: "Container ID", placeholder: "GTM-XXXXXXX" }],
  "meta-pixel": [{ key: "pixel_id", label: "Pixel ID", placeholder: "123456789" }],
  "linkedin-insight": [{ key: "partner_id", label: "Partner ID", placeholder: "123456" }],
  rybbit: [
    { key: "site_id", label: "Site ID", placeholder: "Your Rybbit site ID" },
    { key: "analytics_host", label: "Analytics Host (optional)", placeholder: "https://app.rybbit.io" },
  ],
  posthog: [
    { key: "api_key", label: "API Key", placeholder: "phc_..." },
    { key: "host", label: "Host", placeholder: "https://app.posthog.com" },
  ],
  custom: [
    { key: "script_url", label: "Script URL", placeholder: "https://..." },
    { key: "site_id", label: "Site ID", placeholder: "" },
  ],
};

function getTrackingSnippet(provider: AnalyticsProvider, config: Record<string, string>): string {
  switch (provider) {
    case "ga4": {
      const id = config.measurement_id || "G-XXXXXXXXXX";
      return `<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${id}');
</script>`;
    }
    case "gtm": {
      const id = config.container_id || "GTM-XXXXXXX";
      return `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');</script>
<!-- End Google Tag Manager -->

<!-- Google Tag Manager (noscript) - place after <body> -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${id}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
    }
    case "meta-pixel": {
      const id = config.pixel_id || "YOUR_PIXEL_ID";
      return `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1"/></noscript>`;
    }
    case "linkedin-insight": {
      const id = config.partner_id || "YOUR_PARTNER_ID";
      return `<!-- LinkedIn Insight Tag -->
<script type="text/javascript">
_linkedin_partner_id = "${id}";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script>
<script type="text/javascript">
(function(l) {
if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q=[]}
var s = document.getElementsByTagName("script")[0];
var b = document.createElement("script");
b.type = "text/javascript";b.async = true;
b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b, s);})(window.lintrk);
</script>`;
    }
    case "rybbit": {
      const siteId = config.site_id || "YOUR_SITE_ID";
      const host = config.analytics_host || "https://app.rybbit.io";
      return `<!-- Rybbit Analytics -->
<script defer src="${host}/api/script.js" data-site-id="${siteId}"></script>`;
    }
    case "posthog": {
      const key = config.api_key || "phc_YOUR_KEY";
      const host = config.host || "https://app.posthog.com";
      return `<!-- PostHog Analytics -->
<script>
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('${key}',{api_host:'${host}'})
</script>`;
    }
    case "custom": {
      const url = config.script_url || "https://your-analytics.com/script.js";
      const siteId = config.site_id ? ` data-site-id="${config.site_id}"` : "";
      return `<!-- Custom Analytics -->
<script defer src="${url}"${siteId}></script>`;
    }
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? (
        <>
          <Check className="mr-2 h-4 w-4 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="mr-2 h-4 w-4" />
          Copy Snippet
        </>
      )}
    </Button>
  );
}

/** Extract a plain string from a JSONB value that may be a JSON string primitive or an object. */
function extractString(val: unknown): string {
  if (typeof val === "string") return val;
  return "";
}

export default function SettingsPage() {
  const [general, setGeneral] = useState<GeneralSettings>({
    site_name: "",
    site_url: "",
    site_description: "",
    tagline: "",
  });
  const [seo, setSeo] = useState<SeoSettings>({
    meta_title_template: "",
    meta_description: "",
    og_image: "",
  });
  const [social, setSocial] = useState<SocialSettings>({
    twitter: "",
    linkedin: "",
    github: "",
    youtube: "",
  });
  const [analytics, setAnalytics] = useState<AnalyticsEntry[]>([]);
  const [legal, setLegal] = useState<LegalSettings>({
    disclosure_text: "",
    terms_url: "",
    privacy_url: "",
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingTab, setSavingTab] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedTab, setSavedTab] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const { data } = await res.json() as { data: { key: string; value: unknown }[] };
        const byKey = Object.fromEntries(data.map((s) => [s.key, s.value]));

        // General: each key is a top-level JSONB string primitive
        setGeneral({
          site_name: extractString(byKey["site_name"]),
          site_url: extractString(byKey["site_url"]),
          site_description: extractString(byKey["site_description"]),
          tagline: extractString((byKey["tagline"] as Record<string, unknown>)),
        });

        // SEO: stored as { meta_title_template, meta_description, og_image }
        const seoVal = (byKey["seo_settings"] ?? {}) as Record<string, unknown>;
        setSeo({
          meta_title_template: extractString(seoVal.meta_title_template),
          meta_description: extractString(seoVal.meta_description),
          og_image: extractString(seoVal.og_image),
        });

        // Social: stored as { twitter, linkedin, github, youtube }
        const socialVal = (byKey["social_handles"] ?? {}) as Record<string, unknown>;
        setSocial({
          twitter: extractString(socialVal.twitter),
          linkedin: extractString(socialVal.linkedin),
          github: extractString(socialVal.github),
          youtube: extractString(socialVal.youtube),
        });

        // Analytics: stored as { providers: [...] }
        const analyticsVal = byKey["analytics_providers"];
        let providers: AnalyticsEntry[] = [];
        if (analyticsVal && typeof analyticsVal === "object" && !Array.isArray(analyticsVal)) {
          const raw = (analyticsVal as Record<string, unknown>).providers;
          if (Array.isArray(raw)) {
            providers = (raw as Record<string, unknown>[]).map((p) => ({
              id: (p.id as string) ?? crypto.randomUUID(),
              provider: (p.provider as AnalyticsProvider) ?? "ga4",
              config: (p.config as Record<string, string>) ?? {},
              enabled: (p.enabled as boolean) ?? true,
            }));
          }
        } else if (Array.isArray(analyticsVal)) {
          // Legacy: bare array (old seed format)
          providers = (analyticsVal as Record<string, unknown>[]).map((p) => ({
            id: (p.id as string) ?? crypto.randomUUID(),
            provider: (p.provider as AnalyticsProvider) ?? "ga4",
            config: (p.config as Record<string, string>) ?? {},
            enabled: (p.enabled as boolean) ?? true,
          }));
        }
        setAnalytics(providers);

        // Legal: stored as { disclosure_text, terms_url, privacy_url }
        const legalVal = (byKey["legal_settings"] ?? {}) as Record<string, unknown>;
        // Also fall back to legacy legal_disclosure key (plain string)
        const legacyDisclosure = extractString(byKey["legal_disclosure"]);
        setLegal({
          disclosure_text: extractString(legalVal.disclosure_text) || legacyDisclosure,
          terms_url: extractString(legalVal.terms_url),
          privacy_url: extractString(legalVal.privacy_url),
        });
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  async function handleSave(tab: string) {
    setSavingTab(tab);
    setSaveError(null);
    setSavedTab(null);

    try {
      let settings: { key: string; value: unknown }[] = [];

      if (tab === "general") {
        settings = [
          { key: "site_name", value: general.site_name },
          { key: "site_url", value: general.site_url },
          { key: "site_description", value: general.site_description },
          { key: "tagline", value: general.tagline },
        ];
      } else if (tab === "seo") {
        settings = [
          {
            key: "seo_settings",
            value: {
              meta_title_template: seo.meta_title_template,
              meta_description: seo.meta_description,
              og_image: seo.og_image,
            },
          },
        ];
      } else if (tab === "social") {
        settings = [
          {
            key: "social_handles",
            value: {
              twitter: social.twitter,
              linkedin: social.linkedin,
              github: social.github,
              youtube: social.youtube,
            },
          },
        ];
      } else if (tab === "analytics") {
        settings = [
          {
            key: "analytics_providers",
            value: { providers: analytics },
          },
        ];
      } else if (tab === "legal") {
        settings = [
          {
            key: "legal_settings",
            value: {
              disclosure_text: legal.disclosure_text,
              terms_url: legal.terms_url,
              privacy_url: legal.privacy_url,
            },
          },
        ];
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      setSavedTab(tab);
      setTimeout(() => setSavedTab(null), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSavingTab(null);
    }
  }

  function addAnalyticsProvider() {
    const entry: AnalyticsEntry = {
      id: crypto.randomUUID(),
      provider: "ga4",
      config: {},
      enabled: true,
    };
    setAnalytics((prev) => [...prev, entry]);
  }

  function removeAnalyticsProvider(id: string) {
    setAnalytics((prev) => prev.filter((a) => a.id !== id));
  }

  function updateAnalyticsEntry(id: string, updates: Partial<AnalyticsEntry>) {
    setAnalytics((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const updated = { ...a, ...updates };
        // Reset config when provider changes
        if (updates.provider && updates.provider !== a.provider) {
          updated.config = {};
        }
        return updated;
      })
    );
  }

  function updateAnalyticsConfig(id: string, key: string, value: string) {
    setAnalytics((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, config: { ...a.config, [key]: value } } : a
      )
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Settings</h1>
          <p className="text-muted-foreground">
            Configure your site settings, SEO, social links, and more.
          </p>
        </div>
        <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
          Loading settings...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Settings</h1>
          <p className="text-muted-foreground">
            Configure your site settings, SEO, social links, and more.
          </p>
        </div>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load settings: {loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Site Settings</h1>
        <p className="text-muted-foreground">
          Configure your site settings, SEO, social links, and more.
        </p>
      </div>

      {saveError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      {savedTab && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          Settings saved successfully.
        </div>
      )}

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
          <TabsTrigger value="legal">
            <Scale className="mr-2 h-4 w-4" />
            Legal
          </TabsTrigger>
          <TabsTrigger value="tracking">
            <Code className="mr-2 h-4 w-4" />
            Tracking Pixels
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
              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  placeholder="My Site"
                  value={general.site_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setGeneral((prev) => ({ ...prev, site_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_url">Site URL</Label>
                <Input
                  id="site_url"
                  placeholder="https://example.com"
                  value={general.site_url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setGeneral((prev) => ({ ...prev, site_url: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_description">Site Description</Label>
                <Textarea
                  id="site_description"
                  placeholder="A brief description of your site..."
                  value={general.site_description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setGeneral((prev) => ({
                      ...prev,
                      site_description: e.target.value,
                    }))
                  }
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  placeholder="Your site's tagline"
                  value={general.tagline}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setGeneral((prev) => ({ ...prev, tagline: e.target.value }))
                  }
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t pt-6">
              <Button
                onClick={() => handleSave("general")}
                disabled={savingTab === "general"}
              >
                <Save className="mr-2 h-4 w-4" />
                {savingTab === "general" ? "Saving..." : "Save Changes"}
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
                Default search engine optimization settings for your site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title_template">Meta Title Template</Label>
                <Input
                  id="meta_title_template"
                  placeholder="%s | My Site"
                  value={seo.meta_title_template}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSeo((prev) => ({
                      ...prev,
                      meta_title_template: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Use %s as a placeholder for the page title.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description">Default Meta Description</Label>
                <Textarea
                  id="meta_description"
                  placeholder="Default description for pages without a custom one..."
                  value={seo.meta_description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setSeo((prev) => ({
                      ...prev,
                      meta_description: e.target.value,
                    }))
                  }
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  {seo.meta_description.length}/160 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="og_image">Default OG Image URL</Label>
                <Input
                  id="og_image"
                  placeholder="https://example.com/og-image.jpg"
                  value={seo.og_image}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSeo((prev) => ({ ...prev, og_image: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Used when pages don&apos;t have their own OG image.
                </p>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t pt-6">
              <Button
                onClick={() => handleSave("seo")}
                disabled={savingTab === "seo"}
              >
                <Save className="mr-2 h-4 w-4" />
                {savingTab === "seo" ? "Saving..." : "Save Changes"}
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
                Your social media profiles and links.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X Handle</Label>
                <Input
                  id="twitter"
                  placeholder="@yourhandle"
                  value={social.twitter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSocial((prev) => ({ ...prev, twitter: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/company/..."
                  value={social.linkedin}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSocial((prev) => ({ ...prev, linkedin: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub URL</Label>
                <Input
                  id="github"
                  placeholder="https://github.com/..."
                  value={social.github}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSocial((prev) => ({ ...prev, github: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube URL</Label>
                <Input
                  id="youtube"
                  placeholder="https://youtube.com/@..."
                  value={social.youtube}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSocial((prev) => ({ ...prev, youtube: e.target.value }))
                  }
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t pt-6">
              <Button
                onClick={() => handleSave("social")}
                disabled={savingTab === "social"}
              >
                <Save className="mr-2 h-4 w-4" />
                {savingTab === "social" ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Analytics Providers</CardTitle>
                  <CardDescription>
                    Configure analytics and tracking integrations.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={addAnalyticsProvider}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Provider
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                  <BarChart3 className="h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm font-medium">
                    No analytics providers configured
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add a provider to start tracking site analytics.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={addAnalyticsProvider}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Provider
                  </Button>
                </div>
              ) : (
                analytics.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Select
                          value={entry.provider}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateAnalyticsEntry(entry.id, {
                              provider: e.target.value as AnalyticsProvider,
                            })
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
                            checked={entry.enabled}
                            onCheckedChange={(checked: boolean) =>
                              updateAnalyticsEntry(entry.id, { enabled: checked })
                            }
                          />
                          <Label className="text-sm">
                            {entry.enabled ? "Enabled" : "Disabled"}
                          </Label>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeAnalyticsProvider(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {PROVIDER_CONFIG_FIELDS[entry.provider].map((field) => (
                        <div key={field.key} className="space-y-1">
                          <Label className="text-xs">{field.label}</Label>
                          <Input
                            placeholder={field.placeholder}
                            value={entry.config[field.key] || ""}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                              updateAnalyticsConfig(
                                entry.id,
                                field.key,
                                e.target.value
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
            {analytics.length > 0 && (
              <CardFooter className="justify-end border-t pt-6">
                <Button
                  onClick={() => handleSave("analytics")}
                  disabled={savingTab === "analytics"}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {savingTab === "analytics" ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        {/* Tracking Pixels Tab */}
        <TabsContent value="tracking">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tracking Pixel Snippets</CardTitle>
                <CardDescription>
                  Copy-paste ready tracking code for your providers. These snippets are auto-generated
                  from your Analytics tab configuration. For Next.js sites using this CMS, providers
                  are loaded automatically — these snippets are for external or non-Next.js pages.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {analytics.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <Code className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-3 text-sm font-medium">No providers configured</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add a provider in the Analytics tab first, then come back here for the snippet.
                    </p>
                  </div>
                ) : (
                  analytics.map((entry) => {
                    const snippet = getTrackingSnippet(entry.provider, entry.config);
                    return (
                      <div key={entry.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold">
                              {PROVIDER_LABELS[entry.provider]}
                            </h3>
                            {!entry.enabled && (
                              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                                Disabled
                              </span>
                            )}
                          </div>
                          <CopyButton text={snippet} />
                        </div>
                        <pre className="overflow-x-auto rounded-lg bg-gray-950 p-4 text-xs text-gray-300">
                          <code>{snippet}</code>
                        </pre>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Quick-add preset cards */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Setup Guides</CardTitle>
                <CardDescription>
                  Common tracking setups with one-click copy.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold text-sm">Google Analytics 4</h3>
                  <p className="text-xs text-muted-foreground">
                    Paste your Measurement ID (starts with G-) to get a ready-to-use snippet.
                  </p>
                  <div className="space-y-2">
                    <Input
                      id="quick-ga4"
                      placeholder="G-XXXXXXXXXX"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const el = document.getElementById("quick-ga4-snippet") as HTMLElement;
                        if (el) el.dataset.id = e.target.value;
                      }}
                    />
                    <CopyButton
                      text={`<!-- Google Analytics 4 -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'G-XXXXXXXXXX');\n</script>`}
                    />
                    <p className="text-xs text-muted-foreground">
                      Replace G-XXXXXXXXXX with your Measurement ID after copying.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold text-sm">Rybbit Analytics</h3>
                  <p className="text-xs text-muted-foreground">
                    Privacy-friendly analytics. Just one script tag needed.
                  </p>
                  <div className="space-y-2">
                    <Input
                      id="quick-rybbit"
                      placeholder="Your Site ID"
                    />
                    <CopyButton
                      text={`<!-- Rybbit Analytics -->\n<script defer src="https://app.rybbit.io/api/script.js" data-site-id="YOUR_SITE_ID"></script>`}
                    />
                    <p className="text-xs text-muted-foreground">
                      Replace YOUR_SITE_ID with your Rybbit site ID after copying.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Legal Tab */}
        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle>Legal Settings</CardTitle>
              <CardDescription>
                Disclosure text, terms, and privacy policy links.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="disclosure_text">Disclosure Text</Label>
                <Textarea
                  id="disclosure_text"
                  placeholder="Affiliate disclosure, editorial policy, or other required disclosures..."
                  value={legal.disclosure_text}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setLegal((prev) => ({
                      ...prev,
                      disclosure_text: e.target.value,
                    }))
                  }
                  className="min-h-[160px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms_url">Terms of Service URL</Label>
                <Input
                  id="terms_url"
                  placeholder="https://example.com/terms"
                  value={legal.terms_url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLegal((prev) => ({ ...prev, terms_url: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privacy_url">Privacy Policy URL</Label>
                <Input
                  id="privacy_url"
                  placeholder="https://example.com/privacy"
                  value={legal.privacy_url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLegal((prev) => ({
                      ...prev,
                      privacy_url: e.target.value,
                    }))
                  }
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t pt-6">
              <Button
                onClick={() => handleSave("legal")}
                disabled={savingTab === "legal"}
              >
                <Save className="mr-2 h-4 w-4" />
                {savingTab === "legal" ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
