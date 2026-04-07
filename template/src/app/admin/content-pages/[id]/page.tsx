"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Input,
  Textarea,
  Select,
  Label,
  Separator,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@pandotic/universal-cms/components/ui";
import { cn } from "@pandotic/universal-cms/utils";
import {
  ArrowLeft,
  Save,
  Send,
  Archive,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type PageType = "article" | "guide" | "landing" | "custom";
type PageStatus = "draft" | "published" | "archived";

interface ContentPageData {
  id?: string;
  title: string;
  slug: string;
  page_type: PageType;
  body: string;
  excerpt: string;
  status: PageStatus;
  seo_title: string;
  seo_description: string;
  og_image: string;
}

const EMPTY_PAGE: ContentPageData = {
  title: "",
  slug: "",
  page_type: "article",
  body: "",
  excerpt: "",
  status: "draft",
  seo_title: "",
  seo_description: "",
  og_image: "",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ContentPageEditorPage() {
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [page, setPage] = useState<ContentPageData>(EMPTY_PAGE);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/content-pages/${id}`)
        .then((res) => res.json())
        .then((json) => { if (json.data) setPage(json.data); })
        .catch(() => {});
    }
  }, [id, isNew]);

  const updateField = useCallback(
    <K extends keyof ContentPageData>(field: K, value: ContentPageData[K]) => {
      setPage((prev) => {
        const updated = { ...prev, [field]: value };
        if (field === "title" && !slugManuallyEdited) {
          updated.slug = slugify(value as string);
        }
        return updated;
      });
    },
    [slugManuallyEdited]
  );

  async function handleSave(targetStatus?: PageStatus) {
    setSaving(true);
    const payload = { ...page, status: targetStatus || page.status };
    const method = isNew ? "POST" : "PUT";
    const url = isNew ? "/api/admin/content-pages" : `/api/admin/content-pages/${id}`;
    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (targetStatus) {
        setPage((prev) => ({ ...prev, status: targetStatus }));
      }
    } catch {
      // Handle error
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/content-pages">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? "New Page" : "Edit Page"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave()} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          {page.status !== "published" && (
            <Button onClick={() => handleSave("published")} disabled={saving}>
              <Send className="mr-2 h-4 w-4" />
              Publish
            </Button>
          )}
          {page.status === "published" && (
            <Button variant="secondary" onClick={() => handleSave("archived")} disabled={saving}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Main Form */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Page title"
                  value={page.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("title", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground-secondary">/</span>
                  <Input
                    id="slug"
                    placeholder="page-slug"
                    value={page.slug}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setSlugManuallyEdited(true);
                      updateField("slug", e.target.value);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Textarea
                  id="body"
                  placeholder="Write your content here..."
                  value={page.body}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateField("body", e.target.value)
                  }
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Brief description of this page..."
                  value={page.excerpt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateField("excerpt", e.target.value)
                  }
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO Section */}
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => setSeoOpen(!seoOpen)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">SEO Settings</CardTitle>
                {seoOpen ? (
                  <ChevronUp className="h-4 w-4 text-foreground-tertiary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-foreground-tertiary" />
                )}
              </div>
            </CardHeader>
            {seoOpen && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    placeholder="Custom title for search engines"
                    value={page.seo_title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateField("seo_title", e.target.value)
                    }
                  />
                  <p className="text-xs text-foreground-tertiary">
                    {page.seo_title.length}/60 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    placeholder="Meta description for search results"
                    value={page.seo_description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      updateField("seo_description", e.target.value)
                    }
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-foreground-tertiary">
                    {page.seo_description.length}/160 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_image">OG Image URL</Label>
                  <Input
                    id="og_image"
                    placeholder="https://example.com/image.jpg"
                    value={page.og_image}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateField("og_image", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Page Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="page_type">Page Type</Label>
                <Select
                  id="page_type"
                  value={page.page_type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    updateField("page_type", e.target.value as PageType)
                  }
                >
                  <option value="article">Article</option>
                  <option value="guide">Guide</option>
                  <option value="landing">Landing Page</option>
                  <option value="custom">Custom</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <p className="text-sm">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                      page.status === "draft" && "bg-surface-tertiary text-foreground-secondary",
                      page.status === "published" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                      page.status === "archived" && "border border-border bg-surface text-foreground-secondary"
                    )}
                  >
                    {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
