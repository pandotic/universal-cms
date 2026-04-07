"use client";

import { useState, useEffect } from "react";
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
  BookA,
} from "lucide-react";

// ---------- types ----------
interface GlossaryTerm {
  id: string;
  term: string;
  slug: string;
  acronym: string;
  definition: string;
  longDefinition: string;
  relatedTermIds: string[];
  categoryIds: string[];
  frameworkIds: string[];
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const EMPTY_FORM = {
  term: "",
  slug: "",
  acronym: "",
  definition: "",
  longDefinition: "",
  relatedTermIds: "",
  categoryIds: "",
  frameworkIds: "",
};

// ---------- component ----------
export default function GlossaryPage() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [letterFilter, setLetterFilter] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetch("/api/admin/taxonomy/glossary")
      .then((res) => res.json())
      .then((json) => {
        setTerms(json.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = terms.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      t.term.toLowerCase().includes(q) ||
      (t.acronym ?? "").toLowerCase().includes(q);
    const matchesLetter =
      !letterFilter ||
      t.term.charAt(0).toUpperCase() === letterFilter;
    return matchesSearch && matchesLetter;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  };

  const openEdit = (t: GlossaryTerm) => {
    setEditingId(t.id);
    setForm({
      term: t.term,
      slug: t.slug ?? "",
      acronym: t.acronym ?? "",
      definition: t.definition ?? "",
      longDefinition: t.longDefinition ?? "",
      relatedTermIds: (t.relatedTermIds ?? []).join(", "),
      categoryIds: (t.categoryIds ?? []).join(", "),
      frameworkIds: (t.frameworkIds ?? []).join(", "),
    });
    setShowDialog(true);
  };

  const parseCommaList = (str: string): string[] =>
    str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSave = () => {
    const payload = {
      term: form.term,
      slug:
        form.slug ||
        form.term
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      acronym: form.acronym,
      definition: form.definition,
      longDefinition: form.longDefinition,
      relatedTermIds: parseCommaList(form.relatedTermIds),
      categoryIds: parseCommaList(form.categoryIds),
      frameworkIds: parseCommaList(form.frameworkIds),
    };

    if (editingId) {
      setTerms((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, ...payload } : t))
      );
      fetch(`/api/admin/taxonomy/glossary/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } else {
      const newTerm: GlossaryTerm = {
        id: `g_${Date.now()}`,
        ...payload,
      };
      setTerms((prev) => [...prev, newTerm]);
      fetch("/api/admin/taxonomy/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.data?.id) {
            setTerms((prev) =>
              prev.map((t) =>
                t.id === newTerm.id ? { ...t, id: json.data.id } : t
              )
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
    if (!confirm("Are you sure you want to delete this term?")) return;
    setTerms((prev) => prev.filter((t) => t.id !== id));
    fetch(`/api/admin/taxonomy/glossary/${id}`, { method: "DELETE" }).catch(
      () => {}
    );
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Glossary</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage ESG glossary terms and definitions
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Term
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by term or acronym..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setLetterFilter("")}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium transition-colors",
                !letterFilter
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
              All
            </button>
            {LETTERS.map((letter) => (
              <button
                key={letter}
                onClick={() =>
                  setLetterFilter(letterFilter === letter ? "" : letter)
                }
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors",
                  letterFilter === letter
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                {letter}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                <TableHead>Acronym</TableHead>
                <TableHead className="min-w-[300px]">Definition</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead className="text-center">Related</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-gray-500"
                  >
                    <BookA className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    No terms found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.term}</TableCell>
                    <TableCell className="text-sm text-gray-600 font-mono">
                      {t.acronym || "--"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {t.definition && t.definition.length > 120
                        ? t.definition.slice(0, 120) + "..."
                        : t.definition || "--"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(t.categoryIds ?? []).slice(0, 2).map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                          >
                            {cat}
                          </span>
                        ))}
                        {(t.categoryIds ?? []).length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{t.categoryIds.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-sm">
                      {(t.relatedTermIds ?? []).length}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(t)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onClick={() => handleDelete(t.id)}
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

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Term" : "New Term"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update glossary term details."
                : "Add a new glossary term and definition."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="gl-term">Term</Label>
                <Input
                  id="gl-term"
                  value={form.term}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, term: e.target.value }))
                  }
                  placeholder="e.g. Carbon Offset"
                />
              </div>
              <div>
                <Label htmlFor="gl-acronym">Acronym</Label>
                <Input
                  id="gl-acronym"
                  value={form.acronym}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, acronym: e.target.value }))
                  }
                  placeholder="e.g. CO"
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="gl-slug">Slug</Label>
              <Input
                id="gl-slug"
                value={form.slug}
                onChange={(e) =>
                  setForm((p) => ({ ...p, slug: e.target.value }))
                }
                placeholder="Auto-generated from term if empty"
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="gl-def">Definition</Label>
              <Textarea
                id="gl-def"
                value={form.definition}
                onChange={(e) =>
                  setForm((p) => ({ ...p, definition: e.target.value }))
                }
                placeholder="Short definition..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="gl-longdef">Long Definition</Label>
              <Textarea
                id="gl-longdef"
                value={form.longDefinition}
                onChange={(e) =>
                  setForm((p) => ({ ...p, longDefinition: e.target.value }))
                }
                placeholder="Detailed explanation..."
                rows={5}
              />
            </div>
            <div>
              <Label htmlFor="gl-related">Related Term IDs</Label>
              <Input
                id="gl-related"
                value={form.relatedTermIds}
                onChange={(e) =>
                  setForm((p) => ({ ...p, relatedTermIds: e.target.value }))
                }
                placeholder="Comma-separated IDs"
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="gl-categories">Category IDs</Label>
              <Input
                id="gl-categories"
                value={form.categoryIds}
                onChange={(e) =>
                  setForm((p) => ({ ...p, categoryIds: e.target.value }))
                }
                placeholder="Comma-separated category IDs"
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="gl-frameworks">Framework IDs</Label>
              <Input
                id="gl-frameworks"
                value={form.frameworkIds}
                onChange={(e) =>
                  setForm((p) => ({ ...p, frameworkIds: e.target.value }))
                }
                placeholder="Comma-separated framework IDs"
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.term.trim()}>
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
