"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Textarea,
  Label,
  Select,
} from "@/components/ui/shadcn";
import { cn } from "@/lib/utils";
import { ArrowLeft, Save, Send, X, Plus } from "lucide-react";

// ---------- types ----------
type EntityType = "vendor" | "organization" | "regulator" | "standard-body";
type EntityStatus = "published" | "draft" | "archived";

interface EntityForm {
  name: string;
  slug: string;
  type: EntityType;
  description: string;
  website: string;
  headquarters: string;
  founded_year: string;
  categories: string[];
  frameworks: string[];
  tags: string[];
  tier: string;
  featured: boolean;
  long_description: string;
  profile_json: string;
  seo_title: string;
  seo_description: string;
  og_image: string;
  canonical_path: string;
  status: EntityStatus;
}

const EMPTY_FORM: EntityForm = {
  name: "",
  slug: "",
  type: "vendor",
  description: "",
  website: "",
  headquarters: "",
  founded_year: "",
  categories: [],
  frameworks: [],
  tags: [],
  tier: "",
  featured: false,
  long_description: "",
  profile_json: "{}",
  seo_title: "",
  seo_description: "",
  og_image: "",
  canonical_path: "",
  status: "draft",
};

const TYPE_OPTIONS = [
  { value: "vendor", label: "Vendor" },
  { value: "organization", label: "Organization" },
  { value: "regulator", label: "Regulator" },
  { value: "standard-body", label: "Standard Body" },
];

const TIER_OPTIONS = [
  { value: "", label: "No tier" },
  { value: "tier-1", label: "Tier 1" },
  { value: "tier-2", label: "Tier 2" },
  { value: "tier-3", label: "Tier 3" },
];

const KNOWN_CATEGORIES = [
  "ESG Ratings",
  "Carbon Accounting",
  "Climate Risk",
  "Supply Chain",
  "Reporting & Disclosure",
  "Impact Measurement",
  "Green Finance",
  "Biodiversity",
  "Social Impact",
  "Governance",
];

// ---------- tags input component ----------
function TagsInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full p-0.5 hover:bg-gray-200"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder ?? "Type and press Enter"}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------- component ----------
export default function EntityEditPage() {
  const params = useParams();
  const router = useRouter();
  const entityId = params.id as string;
  const isNew = entityId === "new";

  const [form, setForm] = useState<EntityForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/taxonomy/entities/${entityId}`)
      .then((res) => res.json())
      .then((json) => {
        const d = json.data ?? json;
        setForm({
          name: d.name ?? "",
          slug: d.slug ?? "",
          type: d.type ?? "vendor",
          description: d.description ?? "",
          website: d.website ?? "",
          headquarters: d.headquarters ?? "",
          founded_year: d.founded_year?.toString() ?? "",
          categories: d.categories ?? [],
          frameworks: d.frameworks ?? [],
          tags: d.tags ?? [],
          tier: d.tier ?? "",
          featured: d.featured ?? false,
          long_description: d.long_description ?? "",
          profile_json: d.profile ? JSON.stringify(d.profile, null, 2) : "{}",
          seo_title: d.seo_title ?? "",
          seo_description: d.seo_description ?? "",
          og_image: d.og_image ?? "",
          canonical_path: d.canonical_path ?? "",
          status: d.status ?? "draft",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [entityId, isNew]);

  const updateField = <K extends keyof EntityForm>(
    key: K,
    value: EntityForm[K]
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && isNew) {
        next.slug = (value as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      return next;
    });
  };

  const handleSave = async (status?: EntityStatus) => {
    setSaving(true);
    const payload: Record<string, unknown> = {
      ...form,
      founded_year: form.founded_year ? parseInt(form.founded_year, 10) : null,
      status: status ?? form.status,
    };

    // Parse profile JSON
    try {
      payload.profile = JSON.parse(form.profile_json);
    } catch {
      alert("Profile JSON is invalid");
      setSaving(false);
      return;
    }
    delete payload.profile_json;

    try {
      const url = isNew
        ? "/api/admin/taxonomy/entities"
        : `/api/admin/taxonomy/entities/${entityId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/admin/directory");
      }
    } catch {
      // silently handle
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/directory">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? "New Entity" : "Edit Entity"}
            </h1>
            {!isNew && (
              <p className="text-sm text-gray-500">ID: {entityId}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave("draft")}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave("published")} disabled={saving}>
            <Send className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
          <CardDescription>Core entity information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Entity name"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="auto-generated-from-name"
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                options={TYPE_OPTIONS}
                value={form.type}
                onChange={(e) =>
                  updateField("type", e.target.value as EntityType)
                }
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Brief description of the entity"
              rows={3}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="headquarters">Headquarters</Label>
              <Input
                id="headquarters"
                value={form.headquarters}
                onChange={(e) => updateField("headquarters", e.target.value)}
                placeholder="City, Country"
              />
            </div>
            <div>
              <Label htmlFor="founded_year">Founded Year</Label>
              <Input
                id="founded_year"
                type="number"
                value={form.founded_year}
                onChange={(e) => updateField("founded_year", e.target.value)}
                placeholder="2020"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classification */}
      <Card>
        <CardHeader>
          <CardTitle>Classification</CardTitle>
          <CardDescription>
            Categories, frameworks, and tags
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Categories</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {KNOWN_CATEGORIES.map((cat) => {
                const selected = form.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      updateField(
                        "categories",
                        selected
                          ? form.categories.filter((c) => c !== cat)
                          : [...form.categories, cat]
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      selected
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Frameworks</Label>
            <TagsInput
              value={form.frameworks}
              onChange={(v) => updateField("frameworks", v)}
              placeholder="Add framework (e.g., GRI, SASB)"
            />
          </div>
          <div>
            <Label>Tags</Label>
            <TagsInput
              value={form.tags}
              onChange={(v) => updateField("tags", v)}
              placeholder="Add tag"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tier">Tier</Label>
              <Select
                options={TIER_OPTIONS}
                value={form.tier}
                onChange={(e) => updateField("tier", e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <input
                id="featured"
                type="checkbox"
                checked={form.featured}
                onChange={(e) => updateField("featured", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="featured">Featured entity</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extended Content */}
      <Card>
        <CardHeader>
          <CardTitle>Extended Content</CardTitle>
          <CardDescription>Long-form description</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.long_description}
            onChange={(e) => updateField("long_description", e.target.value)}
            placeholder="Detailed description of the entity, its mission, products, and ESG relevance..."
            rows={8}
          />
        </CardContent>
      </Card>

      {/* Profile Data */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Data</CardTitle>
          <CardDescription>
            Raw profile blob as JSON
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="profile-json">Profile (JSON)</Label>
          <Textarea
            id="profile-json"
            value={form.profile_json}
            onChange={(e) => updateField("profile_json", e.target.value)}
            rows={10}
            className="mt-1 font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
          <CardDescription>Search engine optimization fields</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="seo_title">SEO Title</Label>
            <Input
              id="seo_title"
              value={form.seo_title}
              onChange={(e) => updateField("seo_title", e.target.value)}
              placeholder="Page title for search engines"
            />
          </div>
          <div>
            <Label htmlFor="seo_description">SEO Description</Label>
            <Textarea
              id="seo_description"
              value={form.seo_description}
              onChange={(e) => updateField("seo_description", e.target.value)}
              placeholder="Meta description for search engines"
              rows={2}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="og_image">OG Image URL</Label>
              <Input
                id="og_image"
                value={form.og_image}
                onChange={(e) => updateField("og_image", e.target.value)}
                placeholder="https://images.example.com/og.png"
              />
            </div>
            <div>
              <Label htmlFor="canonical_path">Canonical Path</Label>
              <Input
                id="canonical_path"
                value={form.canonical_path}
                onChange={(e) => updateField("canonical_path", e.target.value)}
                placeholder="/directory/entity-slug"
                className="font-mono text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
