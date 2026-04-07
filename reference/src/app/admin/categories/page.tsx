"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Select,
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
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderOpen,
  Layers,
} from "lucide-react";

// ---------- types ----------
type LayerName =
  | "Rules & Standards"
  | "Data & Measurement"
  | "Implementation & Services";

interface Category {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  layer: LayerName;
  description: string;
  longDescription: string;
  icon: string;
  entityCount: number;
  sortOrder: number;
}

// ---------- constants ----------
const LAYER_OPTIONS = [
  { value: "Rules & Standards", label: "Rules & Standards" },
  { value: "Data & Measurement", label: "Data & Measurement" },
  { value: "Implementation & Services", label: "Implementation & Services" },
];

const LAYER_COLORS: Record<LayerName, string> = {
  "Rules & Standards": "border-blue-200 bg-blue-50",
  "Data & Measurement": "border-purple-200 bg-purple-50",
  "Implementation & Services": "border-emerald-200 bg-emerald-50",
};

const LAYER_TEXT_COLORS: Record<LayerName, string> = {
  "Rules & Standards": "text-blue-700",
  "Data & Measurement": "text-purple-700",
  "Implementation & Services": "text-emerald-700",
};

const LAYER_ORDER: LayerName[] = [
  "Rules & Standards",
  "Data & Measurement",
  "Implementation & Services",
];

const EMPTY_FORM = {
  name: "",
  slug: "",
  shortName: "",
  layer: "Rules & Standards" as LayerName,
  description: "",
  longDescription: "",
  icon: "",
  entityCount: 0,
  sortOrder: 0,
};

// ---------- component ----------
export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetch("/api/admin/taxonomy/categories")
      .then((res) => res.json())
      .then((json) => {
        setCategories(json.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const groupedByLayer = LAYER_ORDER.reduce<Record<LayerName, Category[]>>(
    (acc, layer) => {
      acc[layer] = categories
        .filter((c) => c.layer === layer)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      return acc;
    },
    {
      "Rules & Standards": [],
      "Data & Measurement": [],
      "Implementation & Services": [],
    }
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug ?? "",
      shortName: cat.shortName ?? "",
      layer: cat.layer,
      description: cat.description ?? "",
      longDescription: cat.longDescription ?? "",
      icon: cat.icon ?? "",
      entityCount: cat.entityCount ?? 0,
      sortOrder: cat.sortOrder ?? 0,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    const payload = {
      ...form,
      slug:
        form.slug ||
        form.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
    };

    if (editingId) {
      setCategories((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...payload } : c))
      );
      fetch(`/api/admin/taxonomy/categories/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } else {
      const newCat: Category = {
        id: `cat_${Date.now()}`,
        ...payload,
      };
      setCategories((prev) => [...prev, newCat]);
      fetch("/api/admin/taxonomy/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.data?.id) {
            setCategories((prev) =>
              prev.map((c) =>
                c.id === newCat.id ? { ...c, id: json.data.id } : c
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
    if (!confirm("Are you sure you want to delete this category?")) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    fetch(`/api/admin/taxonomy/categories/${id}`, { method: "DELETE" }).catch(
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
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage ecosystem layer categories
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Grouped tables by layer */}
      {LAYER_ORDER.map((layer) => {
        const items = groupedByLayer[layer];
        return (
          <Card
            key={layer}
            className={cn("border", LAYER_COLORS[layer])}
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers
                  className={cn("h-5 w-5", LAYER_TEXT_COLORS[layer])}
                />
                <CardTitle className={cn("text-lg", LAYER_TEXT_COLORS[layer])}>
                  {layer}
                </CardTitle>
              </div>
              <CardDescription>
                {items.length} {items.length === 1 ? "category" : "categories"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Short Name</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead className="text-center">Entities</TableHead>
                    <TableHead className="text-center">Sort Order</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-gray-500"
                      >
                        <FolderOpen className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                        No categories in this layer
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cat.name}</p>
                            {cat.description && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {cat.description.length > 80
                                  ? cat.description.slice(0, 80) + "..."
                                  : cat.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {cat.shortName || "--"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {cat.icon || "--"}
                        </TableCell>
                        <TableCell className="text-center tabular-nums text-sm">
                          {cat.entityCount ?? 0}
                        </TableCell>
                        <TableCell className="text-center tabular-nums text-sm">
                          {cat.sortOrder ?? 0}
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
                              <DropdownMenuItem onClick={() => openEdit(cat)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-700"
                                onClick={() => handleDelete(cat.id)}
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
        );
      })}

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Category" : "New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update category details."
                : "Add a new ecosystem category."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. ESG Ratings & Rankings"
                />
              </div>
              <div>
                <Label htmlFor="cat-shortname">Short Name</Label>
                <Input
                  id="cat-shortname"
                  value={form.shortName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, shortName: e.target.value }))
                  }
                  placeholder="e.g. Ratings"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={form.slug}
                onChange={(e) =>
                  setForm((p) => ({ ...p, slug: e.target.value }))
                }
                placeholder="Auto-generated from name if empty"
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label>Layer</Label>
              <Select
                options={LAYER_OPTIONS}
                value={form.layer}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    layer: e.target.value as LayerName,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Short description..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="cat-longdesc">Long Description</Label>
              <Textarea
                id="cat-longdesc"
                value={form.longDescription}
                onChange={(e) =>
                  setForm((p) => ({ ...p, longDescription: e.target.value }))
                }
                placeholder="Detailed description..."
                rows={4}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="cat-icon">Icon</Label>
                <Input
                  id="cat-icon"
                  value={form.icon}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, icon: e.target.value }))
                  }
                  placeholder="e.g. BarChart3"
                />
              </div>
              <div>
                <Label htmlFor="cat-count">Entity Count</Label>
                <Input
                  id="cat-count"
                  type="number"
                  value={form.entityCount}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      entityCount: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="cat-sort">Sort Order</Label>
                <Input
                  id="cat-sort"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      sortOrder: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
