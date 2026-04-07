"use client";

import React, { useState, useCallback, useEffect } from "react";
import brandGuideData from "@/data/brand-guide.json";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Copy,
  Pencil,
  Save,
  Megaphone,
  FileText,
  Search,
  BarChart3,
  Loader2,
} from "lucide-react";

type BrandGuide = typeof brandGuideData;

export default function BrandGuidePage() {
  const [guide, setGuide] = useState<BrandGuide>(brandGuideData);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Fetch from site_settings DB on mount
  useEffect(() => {
    async function fetchGuide() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const json = await res.json();
          const settings = json.data as { key: string; value: Record<string, unknown> }[];
          const brandSetting = settings.find((s: { key: string }) => s.key === "brand_guide");
          if (brandSetting?.value && Object.keys(brandSetting.value).length > 0) {
            setGuide(brandSetting.value as unknown as BrandGuide);
          }
        }
      } catch {
        // Fall back to JSON data
      } finally {
        setLoaded(true);
      }
    }
    fetchGuide();
  }, []);

  const startEdit = useCallback((fieldKey: string, currentValue: string) => {
    setEditingField(fieldKey);
    setEditValue(currentValue);
  }, []);

  const saveEdit = useCallback(
    async (fieldPath: string) => {
      const updated = JSON.parse(JSON.stringify(guide)) as Record<string, unknown>;
      const parts = fieldPath.split(".");
      let obj: Record<string, unknown> = updated;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]] as Record<string, unknown>;
      }
      const lastKey = parts[parts.length - 1];
      const original = obj[lastKey];
      if (typeof original === "number") {
        obj[lastKey] = Number(editValue);
      } else if (typeof original === "boolean") {
        obj[lastKey] = editValue === "true";
      } else {
        obj[lastKey] = editValue;
      }
      setGuide(updated as unknown as BrandGuide);
      setEditingField(null);

      // Persist to DB
      setSaving(true);
      try {
        await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "brand_guide", value: updated }),
        });
      } catch {
        // Silently fail
      } finally {
        setSaving(false);
      }
    },
    [guide, editValue]
  );

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue("");
  }, []);

  const updateListItem = useCallback(
    async (listPath: string, index: number, value: string) => {
      const updated = JSON.parse(JSON.stringify(guide)) as Record<string, unknown>;
      const parts = listPath.split(".");
      let obj: Record<string, unknown> = updated;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]] as Record<string, unknown>;
      }
      (obj[parts[parts.length - 1]] as string[])[index] = value;
      setGuide(updated as unknown as BrandGuide);

      // Persist to DB
      try {
        await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "brand_guide", value: updated }),
        });
      } catch {
        // Silently fail
      }
    },
    [guide]
  );

  function toMarkdown(): string {
    const g = guide;
    const lines: string[] = [];
    lines.push(`# ${g.brandName} Brand Guide`);
    lines.push(`> ${g.tagline}\n`);

    lines.push(`## Voice & Tone\n`);
    lines.push(`**Tone:** ${g.voice.tone}\n`);
    lines.push(`**Personality:** ${g.voice.personality}\n`);
    lines.push(`### Do`);
    g.voice.doList.forEach((item) => lines.push(`- ${item}`));
    lines.push(``);
    lines.push(`### Don't`);
    g.voice.dontList.forEach((item) => lines.push(`- ${item}`));
    lines.push(``);

    lines.push(`## Content Guidelines\n`);
    lines.push(`- **Title Format:** ${g.contentGuidelines.titleFormat}`);
    lines.push(
      `- **Meta Description Length:** ${g.contentGuidelines.metaDescriptionLength.min}–${g.contentGuidelines.metaDescriptionLength.max} characters`
    );
    lines.push(`- **Heading Structure:** ${g.contentGuidelines.headingStructure}`);
    lines.push(`- **Image Requirements:** ${g.contentGuidelines.imageRequirements}`);
    lines.push(`- **CTA Style:** ${g.contentGuidelines.ctaStyle}`);
    lines.push(
      `- **Internal Linking Rules:** ${g.contentGuidelines.internalLinkingRules}`
    );
    lines.push(``);

    lines.push(`## SEO Rules\n`);
    lines.push(`- **Title Max Length:** ${g.seoRules.titleMaxLength}`);
    lines.push(`- **Description Max Length:** ${g.seoRules.descriptionMaxLength}`);
    lines.push(
      `- **Focus Keyword Required:** ${g.seoRules.focusKeywordRequired ? "Yes" : "No"}`
    );
    lines.push(`- **Min Word Count:** ${g.seoRules.minWordCount}`);
    lines.push(`- **Max Reading Level:** ${g.seoRules.maxReadingLevel}`);
    lines.push(``);

    lines.push(`## Tracking Requirements\n`);
    lines.push(
      `**Required Pixels:** ${g.trackingRequirements.requiredPixels.join(", ")}`
    );
    lines.push(`\n### Event Tracking`);
    lines.push(
      `**Required:** ${g.trackingRequirements.eventTracking.required.join(", ")}`
    );
    lines.push(
      `**Recommended:** ${g.trackingRequirements.eventTracking.recommended.join(", ")}`
    );

    return lines.join("\n");
  }

  const handleCopyMarkdown = useCallback(() => {
    navigator.clipboard.writeText(toMarkdown()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide]);

  function InlineEdit({
    fieldKey,
    value,
    label,
  }: {
    fieldKey: string;
    value: string | number | boolean;
    label: string;
  }) {
    const displayValue = String(value);
    const isEditing = editingField === fieldKey;

    return (
      <div className="flex items-start justify-between gap-3 rounded-md px-3 py-2 hover:bg-gray-50">
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-gray-500">{label}</span>
          {isEditing ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit(fieldKey);
                  if (e.key === "Escape") cancelEdit();
                }}
                autoFocus
              />
              <button
                onClick={() => saveEdit(fieldKey)}
                className="rounded p-1 text-green-600 hover:bg-green-50"
                title="Save"
              >
                <Save className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="mt-0.5 text-sm text-gray-900">{displayValue}</p>
          )}
        </div>
        {!isEditing && (
          <button
            onClick={() => startEdit(fieldKey, displayValue)}
            className="mt-1 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-gray-700" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Brand Guide</h1>
            <p className="text-sm text-gray-500">
              {guide.brandName} &mdash; {guide.tagline}
              {saving && <span className="ml-2 text-xs text-blue-500">Saving...</span>}
            </p>
          </div>
        </div>
        <button
          onClick={handleCopyMarkdown}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copied!" : "Copy as Markdown"}
        </button>
      </div>

      {/* Voice & Tone */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-gray-500" />
            <CardTitle>Voice & Tone</CardTitle>
          </div>
          <CardDescription>
            How {guide.brandName} communicates with its audience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InlineEdit fieldKey="voice.tone" value={guide.voice.tone} label="Tone" />
          <InlineEdit
            fieldKey="voice.personality"
            value={guide.voice.personality}
            label="Personality"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Do list */}
            <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-800">
                <CheckCircle2 className="h-4 w-4" /> Do
              </h4>
              <ul className="space-y-2">
                {guide.voice.doList.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                    {editingField === `voice.doList.${i}` ? (
                      <input
                        className="flex-1 rounded border border-green-300 bg-white px-2 py-0.5 text-sm focus:outline-none"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateListItem("voice.doList", i, editValue);
                            setEditingField(null);
                          }
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="cursor-pointer text-sm text-green-900 hover:underline"
                        onClick={() => startEdit(`voice.doList.${i}`, item)}
                      >
                        {item}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Don't list */}
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-800">
                <XCircle className="h-4 w-4" /> Don&apos;t
              </h4>
              <ul className="space-y-2">
                {guide.voice.dontList.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                    {editingField === `voice.dontList.${i}` ? (
                      <input
                        className="flex-1 rounded border border-red-300 bg-white px-2 py-0.5 text-sm focus:outline-none"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateListItem("voice.dontList", i, editValue);
                            setEditingField(null);
                          }
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="cursor-pointer text-sm text-red-900 hover:underline"
                        onClick={() => startEdit(`voice.dontList.${i}`, item)}
                      >
                        {item}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Guidelines */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <CardTitle>Content Guidelines</CardTitle>
          </div>
          <CardDescription>
            Standards for creating consistent, high-quality content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <InlineEdit
            fieldKey="contentGuidelines.titleFormat"
            value={guide.contentGuidelines.titleFormat}
            label="Title Format"
          />
          <div className="flex items-start gap-3 rounded-md px-3 py-2 hover:bg-gray-50">
            <div>
              <span className="text-sm font-medium text-gray-500">
                Meta Description Length
              </span>
              <p className="mt-0.5 text-sm text-gray-900">
                {guide.contentGuidelines.metaDescriptionLength.min}&ndash;
                {guide.contentGuidelines.metaDescriptionLength.max} characters
              </p>
            </div>
          </div>
          <InlineEdit
            fieldKey="contentGuidelines.headingStructure"
            value={guide.contentGuidelines.headingStructure}
            label="Heading Structure"
          />
          <InlineEdit
            fieldKey="contentGuidelines.imageRequirements"
            value={guide.contentGuidelines.imageRequirements}
            label="Image Requirements"
          />
          <InlineEdit
            fieldKey="contentGuidelines.ctaStyle"
            value={guide.contentGuidelines.ctaStyle}
            label="CTA Style"
          />
          <InlineEdit
            fieldKey="contentGuidelines.internalLinkingRules"
            value={guide.contentGuidelines.internalLinkingRules}
            label="Internal Linking Rules"
          />
        </CardContent>
      </Card>

      {/* SEO Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-500" />
            <CardTitle>SEO Rules</CardTitle>
          </div>
          <CardDescription>
            Search engine optimization standards and constraints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {guide.seoRules.titleMaxLength}
              </p>
              <p className="text-xs text-gray-500">Title Max Length</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {guide.seoRules.descriptionMaxLength}
              </p>
              <p className="text-xs text-gray-500">Description Max Length</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {guide.seoRules.minWordCount}
              </p>
              <p className="text-xs text-gray-500">Min Word Count</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {guide.seoRules.maxReadingLevel}
              </p>
              <p className="text-xs text-gray-500">Max Reading Level</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 px-3">
            <Badge variant={guide.seoRules.focusKeywordRequired ? "success" : "secondary"}>
              {guide.seoRules.focusKeywordRequired ? "Required" : "Optional"}
            </Badge>
            <span className="text-sm text-gray-600">Focus Keyword</span>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Requirements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <CardTitle>Tracking Requirements</CardTitle>
          </div>
          <CardDescription>
            Analytics and event tracking standards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-500">Required Pixels</p>
            <div className="flex flex-wrap gap-2">
              {guide.trackingRequirements.requiredPixels.map((pixel) => (
                <Badge key={pixel} variant="default">
                  {pixel}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-500">
              Required Events
            </p>
            <div className="flex flex-wrap gap-2">
              {guide.trackingRequirements.eventTracking.required.map((evt) => (
                <Badge key={evt} variant="success">
                  {evt}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-500">
              Recommended Events
            </p>
            <div className="flex flex-wrap gap-2">
              {guide.trackingRequirements.eventTracking.recommended.map((evt) => (
                <Badge key={evt} variant="outline">
                  {evt}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
