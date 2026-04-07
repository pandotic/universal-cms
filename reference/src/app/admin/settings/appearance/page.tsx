"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Label,
  Textarea,
} from "@/components/ui/shadcn";
import { Save, Trash2, Plus, RotateCcw } from "lucide-react";
import { sanitizeCss } from "@/lib/security/css-sanitizer";

type ThemeMode = "light" | "dark" | "system";

const COLOR_TOKENS = [
  { variable: "--color-brand-primary", label: "Brand Primary" },
  { variable: "--color-surface", label: "Surface" },
  { variable: "--color-surface-secondary", label: "Surface Secondary" },
  { variable: "--color-foreground", label: "Foreground" },
  { variable: "--color-foreground-secondary", label: "Foreground Secondary" },
  { variable: "--color-border", label: "Border" },
] as const;

export default function AppearancePage() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [themeOverrides, setThemeOverrides] = useState<Record<string, string>>({});
  const [customCss, setCustomCss] = useState("");
  const [cssUrls, setCssUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");

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
        const { data } = (await res.json()) as {
          data: { key: string; value: unknown }[];
        };
        const byKey = Object.fromEntries(data.map((s) => [s.key, s.value]));

        // Theme mode
        const mode = byKey["theme_mode"];
        if (mode === "light" || mode === "dark" || mode === "system") {
          setThemeMode(mode);
        }

        // Theme overrides
        const overrides = byKey["theme_overrides"];
        if (overrides && typeof overrides === "object" && !Array.isArray(overrides)) {
          setThemeOverrides(overrides as Record<string, string>);
        }

        // Custom CSS
        const css = byKey["custom_css"];
        if (typeof css === "string") {
          setCustomCss(css);
        }

        // Custom CSS URLs
        const urls = byKey["custom_css_urls"];
        if (Array.isArray(urls)) {
          setCssUrls(urls.filter((u): u is string => typeof u === "string"));
        }
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

    try {
      let settings: { key: string; value: unknown }[] = [];

      if (tab === "theme-mode") {
        settings = [{ key: "theme_mode", value: themeMode }];
      } else if (tab === "colors") {
        settings = [{ key: "theme_overrides", value: themeOverrides }];
      } else if (tab === "custom-css") {
        settings = [{ key: "custom_css", value: sanitizeCss(customCss) }];
      } else if (tab === "stylesheets") {
        settings = [{ key: "custom_css_urls", value: cssUrls }];
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

  function handleColorChange(variable: string, value: string) {
    setThemeOverrides((prev) => ({ ...prev, [variable]: value }));
  }

  function handleColorReset(variable: string) {
    setThemeOverrides((prev) => {
      const next = { ...prev };
      delete next[variable];
      return next;
    });
  }

  function handleAddUrl() {
    const trimmed = newUrl.trim();
    if (!trimmed.startsWith("https://")) return;
    if (cssUrls.includes(trimmed)) return;
    setCssUrls((prev) => [...prev, trimmed]);
    setNewUrl("");
  }

  function handleRemoveUrl(url: string) {
    setCssUrls((prev) => prev.filter((u) => u !== url));
  }

  if (loading) {
    return (
      <AdminShell title="Appearance" description="Theme, colors, and custom CSS">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-brand-primary" />
        </div>
      </AdminShell>
    );
  }

  if (loadError) {
    return (
      <AdminShell title="Appearance" description="Theme, colors, and custom CSS">
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Appearance" description="Theme, colors, and custom CSS">
      {saveError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      <Tabs defaultValue="theme-mode" className="space-y-6">
        <TabsList>
          <TabsTrigger value="theme-mode">Theme Mode</TabsTrigger>
          <TabsTrigger value="colors">Color Overrides</TabsTrigger>
          <TabsTrigger value="custom-css">Custom CSS</TabsTrigger>
          <TabsTrigger value="stylesheets">External Stylesheets</TabsTrigger>
        </TabsList>

        {/* Tab 1: Theme Mode */}
        <TabsContent value="theme-mode">
          <Card>
            <CardHeader>
              <CardTitle>Theme Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground-secondary">
                Choose the default color scheme for all visitors.
              </p>
              <div className="space-y-3">
                {(["light", "dark", "system"] as const).map((mode) => (
                  <label
                    key={mode}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-secondary"
                  >
                    <input
                      type="radio"
                      name="theme-mode"
                      value={mode}
                      checked={themeMode === mode}
                      onChange={() => setThemeMode(mode)}
                      className="h-4 w-4 accent-brand-primary"
                    />
                    <div>
                      <span className="text-sm font-medium capitalize text-foreground">
                        {mode}
                      </span>
                      <p className="text-xs text-foreground-secondary">
                        {mode === "light" && "Always use light theme"}
                        {mode === "dark" && "Always use dark theme"}
                        {mode === "system" && "Follow the visitor's system preference"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => handleSave("theme-mode")}
                  disabled={savingTab === "theme-mode"}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {savingTab === "theme-mode" ? "Saving..." : "Save"}
                </Button>
                {savedTab === "theme-mode" && (
                  <span className="text-sm text-green-600">Saved successfully</span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Color Overrides */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Color Overrides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground-secondary">
                Override the default CSS color tokens. Leave blank to use the theme default.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {COLOR_TOKENS.map(({ variable, label }) => (
                  <div key={variable} className="space-y-1.5">
                    <Label className="text-sm font-medium text-foreground">
                      {label}
                    </Label>
                    <code className="block text-xs text-foreground-secondary">
                      {variable}
                    </code>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeOverrides[variable] || "#000000"}
                        onChange={(e) => handleColorChange(variable, e.target.value)}
                        className="h-9 w-12 cursor-pointer rounded border border-border bg-surface"
                      />
                      <Input
                        value={themeOverrides[variable] || ""}
                        onChange={(e) => handleColorChange(variable, e.target.value)}
                        placeholder="e.g. #3b82f6"
                        className="flex-1"
                      />
                      {themeOverrides[variable] && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleColorReset(variable)}
                          title="Reset to default"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => handleSave("colors")}
                  disabled={savingTab === "colors"}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {savingTab === "colors" ? "Saving..." : "Save"}
                </Button>
                {savedTab === "colors" && (
                  <span className="text-sm text-green-600">Saved successfully</span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Custom CSS */}
        <TabsContent value="custom-css">
          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground-secondary">
                Add raw CSS that will be injected into every page. Dangerous patterns
                (scripts, expressions, imports) are automatically stripped on save.
              </p>
              <Textarea
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                placeholder={`.my-class {\n  color: red;\n}`}
                rows={12}
                className="font-mono text-sm"
              />
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handleSave("custom-css")}
                  disabled={savingTab === "custom-css"}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {savingTab === "custom-css" ? "Saving..." : "Save"}
                </Button>
                {savedTab === "custom-css" && (
                  <span className="text-sm text-green-600">Saved successfully</span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: External Stylesheets */}
        <TabsContent value="stylesheets">
          <Card>
            <CardHeader>
              <CardTitle>External Stylesheets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground-secondary">
                Add external CSS files to load on every page. Only HTTPS URLs are allowed.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/styles.css"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddUrl();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleAddUrl}
                  disabled={!newUrl.trim().startsWith("https://")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              {cssUrls.length > 0 ? (
                <ul className="space-y-2">
                  {cssUrls.map((url) => (
                    <li
                      key={url}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-secondary px-3 py-2"
                    >
                      <code className="truncate text-sm text-foreground-secondary">
                        {url}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveUrl(url)}
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-foreground-secondary italic">
                  No external stylesheets added.
                </p>
              )}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => handleSave("stylesheets")}
                  disabled={savingTab === "stylesheets"}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {savingTab === "stylesheets" ? "Saving..." : "Save"}
                </Button>
                {savedTab === "stylesheets" && (
                  <span className="text-sm text-green-600">Saved successfully</span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
