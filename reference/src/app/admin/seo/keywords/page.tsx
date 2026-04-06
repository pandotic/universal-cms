"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Input,
  Textarea,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Select,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/shadcn";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Tag,
  Upload,
  TrendingUp,
} from "lucide-react";

// ---------- types ----------

type PageType = "none" | "entity" | "framework" | "glossary" | "category" | "content_page";

interface Keyword {
  id: string;
  keyword: string;
  search_volume: number;
  difficulty: number;
  assigned_page_type: PageType;
  assigned_page_slug: string;
  notes: string;
}

// ---------- constants ----------

const PAGE_TYPE_OPTIONS: { value: PageType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "entity", label: "Entity" },
  { value: "framework", label: "Framework" },
  { value: "glossary", label: "Glossary" },
  { value: "category", label: "Category" },
  { value: "content_page", label: "Content Page" },
];

const PAGE_TYPE_COLORS: Record<PageType, string> = {
  none: "bg-gray-100 text-gray-500",
  entity: "bg-indigo-100 text-indigo-700",
  framework: "bg-purple-100 text-purple-700",
  glossary: "bg-teal-100 text-teal-700",
  category: "bg-amber-100 text-amber-700",
  content_page: "bg-blue-100 text-blue-700",
};

const EMPTY_FORM = {
  keyword: "",
  search_volume: "",
  difficulty: "50",
  assigned_page_type: "none" as PageType,
  assigned_page_slug: "",
  notes: "",
};

// ---------- difficulty badge ----------

function difficultyLabel(d: number): string {
  if (d <= 30) return "Easy";
  if (d <= 60) return "Medium";
  if (d <= 80) return "Hard";
  return "Very Hard";
}

function difficultyColor(d: number): string {
  if (d <= 30) return "bg-green-100 text-green-700";
  if (d <= 60) return "bg-yellow-100 text-yellow-700";
  if (d <= 80) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

function DifficultyBadge({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        difficultyColor(value)
      )}
    >
      <span className="tabular-nums">{value}</span>
      <span className="font-normal">— {difficultyLabel(value)}</span>
    </span>
  );
}

// ---------- volume formatter ----------

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toString();
}

// ---------- component ----------

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageTypeFilter, setPageTypeFilter] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [importError, setImportError] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/keywords")
      .then((res) => res.json())
      .then((json) => {
        setKeywords(json.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = keywords.filter((kw) => {
    const matchesSearch = kw.keyword.toLowerCase().includes(search.toLowerCase());
    const matchesType = !pageTypeFilter || kw.assigned_page_type === pageTypeFilter;
    return matchesSearch && matchesType;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  };

  const openEdit = (kw: Keyword) => {
    setEditingId(kw.id);
    setForm({
      keyword: kw.keyword,
      search_volume: kw.search_volume.toString(),
      difficulty: kw.difficulty.toString(),
      assigned_page_type: kw.assigned_page_type,
      assigned_page_slug: kw.assigned_page_slug ?? "",
      notes: kw.notes ?? "",
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    const payload = {
      keyword: form.keyword.trim(),
      search_volume: parseInt(form.search_volume || "0", 10),
      difficulty: Math.min(100, Math.max(0, parseInt(form.difficulty || "0", 10))),
      assigned_page_type: form.assigned_page_type,
      assigned_page_slug: form.assigned_page_slug.trim(),
      notes: form.notes.trim(),
    };

    if (editingId) {
      setKeywords((prev) =>
        prev.map((k) => (k.id === editingId ? { ...k, ...payload } : k))
      );
      fetch(`/api/admin/keywords/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } else {
      const tempId = `kw_${Date.now()}`;
      const newKw: Keyword = { id: tempId, ...payload };
      setKeywords((prev) => [...prev, newKw]);
      fetch("/api/admin/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.data?.id) {
            setKeywords((prev) =>
              prev.map((k) => (k.id === tempId ? { ...k, id: json.data.id } : k))
            );
          }
        })
        .catch(() => {});
    }

    setShowDialog(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this keyword? This cannot be undone.")) return;
    setKeywords((prev) => prev.filter((k) => k.id !== id));
    fetch(`/api/admin/keywords/${id}`, { method: "DELETE" }).catch(() => {});
  };

  // CSV import: expects header row `keyword,volume,difficulty`
  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        setImportError("CSV must have a header row and at least one data row.");
        return;
      }

      // Skip header
      const rows = lines.slice(1);
      const parsed: Omit<Keyword, "id">[] = [];

      for (const row of rows) {
        const cols = row.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        if (cols.length < 1 || !cols[0]) continue;
        parsed.push({
          keyword: cols[0],
          search_volume: cols[1] ? parseInt(cols[1], 10) || 0 : 0,
          difficulty: cols[2] ? Math.min(100, Math.max(0, parseInt(cols[2], 10) || 0)) : 0,
          assigned_page_type: "none",
          assigned_page_slug: "",
          notes: "",
        });
      }

      if (parsed.length === 0) {
        setImportError("No valid rows found in CSV.");
        return;
      }

      // Optimistic add
      const tempItems: Keyword[] = parsed.map((p) => ({
        id: `csv_${Date.now()}_${Math.random()}`,
        ...p,
      }));
      setKeywords((prev) => [...prev, ...tempItems]);

      fetch("/api/admin/keywords/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: parsed }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.data && Array.isArray(json.data)) {
            // Replace temp ids with real ones if returned
            setKeywords((prev) => {
              const replaced = [...prev];
              json.data.forEach((real: Keyword, i: number) => {
                const tempId = tempItems[i]?.id;
                if (tempId) {
                  const idx = replaced.findIndex((k) => k.id === tempId);
                  if (idx !== -1) replaced[idx] = real;
                }
              });
              return replaced;
            });
          }
        })
        .catch(() => {});
    };

    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = "";
  };

  const totalVolume = filtered.reduce((sum, k) => sum + k.search_volume, 0);
  const avgDifficulty =
    filtered.length > 0
      ? Math.round(filtered.reduce((sum, k) => sum + k.difficulty, 0) / filtered.length)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-muted-foreground">Loading keywords...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Keyword Registry</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage target keywords, volumes, and page assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Hidden CSV input */}
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvImport}
          />
          <Button variant="outline" onClick={() => csvInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Keyword
          </Button>
        </div>
      </div>

      {importError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {importError}
        </div>
      )}

      {/* Stats strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Keywords</p>
              <p className="text-2xl font-bold text-gray-900">{keywords.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-green-50 p-2.5 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Search Volume</p>
              <p className="text-2xl font-bold text-gray-900">{formatVolume(totalVolume)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-orange-50 p-2.5 text-orange-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Difficulty</p>
              <p className="text-2xl font-bold text-gray-900">{avgDifficulty}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-48">
            <Select
              options={[
                { value: "", label: "All page types" },
                ...PAGE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
              ]}
              value={pageTypeFilter}
              onChange={(e) => setPageTypeFilter(e.target.value)}
            />
          </div>
          <p className="ml-auto text-sm text-gray-500">
            {filtered.length} of {keywords.length} keywords
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Keyword</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Assigned Page</TableHead>
                <TableHead className="min-w-[180px]">Notes</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                    <Tag className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    {keywords.length === 0 ? "No keywords yet. Add your first keyword." : "No keywords match your filter."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((kw) => (
                  <TableRow key={kw.id}>
                    <TableCell className="font-medium text-gray-900">
                      {kw.keyword}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-gray-600">
                      {kw.search_volume > 0 ? formatVolume(kw.search_volume) : "--"}
                    </TableCell>
                    <TableCell>
                      <DifficultyBadge value={kw.difficulty} />
                    </TableCell>
                    <TableCell>
                      {kw.assigned_page_type !== "none" ? (
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={cn(
                              "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                              PAGE_TYPE_COLORS[kw.assigned_page_type]
                            )}
                          >
                            {kw.assigned_page_type.replace("_", " ")}
                          </span>
                          {kw.assigned_page_slug && (
                            <span className="font-mono text-xs text-gray-400">
                              /{kw.assigned_page_slug}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {kw.notes
                        ? kw.notes.length > 80
                          ? kw.notes.slice(0, 80) + "…"
                          : kw.notes
                        : "--"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(kw)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onClick={() => handleDelete(kw.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Keyword" : "Add Keyword"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update keyword details and page assignment."
                : "Add a keyword to the registry with volume and difficulty data."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto">
            {/* Keyword */}
            <div>
              <Label htmlFor="kw-keyword">Keyword</Label>
              <Input
                id="kw-keyword"
                value={form.keyword}
                onChange={(e) => setForm((p) => ({ ...p, keyword: e.target.value }))}
                placeholder="e.g. ESG reporting software"
              />
            </div>

            {/* Volume + Difficulty */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="kw-volume">Search Volume</Label>
                <Input
                  id="kw-volume"
                  type="number"
                  min={0}
                  value={form.search_volume}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, search_volume: e.target.value }))
                  }
                  placeholder="e.g. 2400"
                />
              </div>
              <div>
                <Label htmlFor="kw-difficulty">
                  Difficulty{" "}
                  <span className="font-normal text-gray-400">(0 – 100)</span>
                </Label>
                <div className="space-y-2">
                  <Input
                    id="kw-difficulty"
                    type="number"
                    min={0}
                    max={100}
                    value={form.difficulty}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, difficulty: e.target.value }))
                    }
                  />
                  {form.difficulty !== "" && (
                    <DifficultyBadge
                      value={Math.min(100, Math.max(0, parseInt(form.difficulty || "0", 10)))}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Page assignment */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="kw-page-type">Page Type</Label>
                <Select
                  options={PAGE_TYPE_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  value={form.assigned_page_type}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      assigned_page_type: e.target.value as PageType,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="kw-slug">Page Slug</Label>
                <Input
                  id="kw-slug"
                  value={form.assigned_page_slug}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, assigned_page_slug: e.target.value }))
                  }
                  placeholder="e.g. esg-reporting-software"
                  className="font-mono text-sm"
                  disabled={form.assigned_page_type === "none"}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="kw-notes">Notes</Label>
              <Textarea
                id="kw-notes"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Competitive notes, content ideas, seasonal flags…"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.keyword.trim()}>
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
