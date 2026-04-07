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
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  BookOpen,
} from "lucide-react";

// ---------- types ----------
type FrameworkType =
  | "standard"
  | "framework"
  | "protocol"
  | "regulation"
  | "taxonomy";

interface Framework {
  id: string;
  name: string;
  acronym: string;
  full_name: string;
  type: FrameworkType;
  governing_body: string;
  region: string;
  website: string;
  description: string;
  status: string;
}

// ---------- constants ----------
const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "standard", label: "Standard" },
  { value: "framework", label: "Framework" },
  { value: "protocol", label: "Protocol" },
  { value: "regulation", label: "Regulation" },
  { value: "taxonomy", label: "Taxonomy" },
];

const REGION_OPTIONS = [
  { value: "", label: "All regions" },
  { value: "Global", label: "Global" },
  { value: "EU", label: "EU" },
  { value: "US", label: "US" },
  { value: "UK", label: "UK" },
  { value: "APAC", label: "APAC" },
];

const TYPE_COLORS: Record<FrameworkType, string> = {
  standard: "bg-blue-100 text-blue-800",
  framework: "bg-purple-100 text-purple-800",
  protocol: "bg-teal-100 text-teal-800",
  regulation: "bg-red-100 text-red-800",
  taxonomy: "bg-amber-100 text-amber-800",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  draft: "bg-yellow-100 text-yellow-800",
  deprecated: "bg-gray-100 text-gray-600",
};

const EMPTY_FORM = {
  name: "",
  acronym: "",
  full_name: "",
  type: "framework" as FrameworkType,
  governing_body: "",
  region: "",
  website: "",
  description: "",
};

// ---------- component ----------
export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetch("/api/admin/taxonomy/frameworks")
      .then((res) => res.json())
      .then((json) => {
        setFrameworks(json.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = frameworks.filter((f) => {
    const q = search.toLowerCase();
    const matchesSearch =
      f.name.toLowerCase().includes(q) ||
      f.acronym?.toLowerCase().includes(q) ||
      f.governing_body?.toLowerCase().includes(q);
    const matchesType = !typeFilter || f.type === typeFilter;
    const matchesRegion = !regionFilter || f.region === regionFilter;
    return matchesSearch && matchesType && matchesRegion;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  };

  const openEdit = (fw: Framework) => {
    setEditingId(fw.id);
    setForm({
      name: fw.name,
      acronym: fw.acronym ?? "",
      full_name: fw.full_name ?? "",
      type: fw.type,
      governing_body: fw.governing_body ?? "",
      region: fw.region ?? "",
      website: fw.website ?? "",
      description: fw.description ?? "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (editingId) {
      // Update
      setFrameworks((prev) =>
        prev.map((f) => (f.id === editingId ? { ...f, ...form } : f))
      );
      fetch(`/api/admin/taxonomy/frameworks/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).catch(() => {});
    } else {
      // Create
      const newFw: Framework = {
        id: `fw_${Date.now()}`,
        ...form,
        status: "active",
      };
      setFrameworks((prev) => [...prev, newFw]);
      fetch("/api/admin/taxonomy/frameworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.data?.id) {
            setFrameworks((prev) =>
              prev.map((f) =>
                f.id === newFw.id ? { ...f, id: json.data.id } : f
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
    if (!confirm("Are you sure you want to delete this framework?")) return;
    setFrameworks((prev) => prev.filter((f) => f.id !== id));
    fetch(`/api/admin/taxonomy/frameworks/${id}`, { method: "DELETE" }).catch(
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
          <h1 className="text-2xl font-bold text-gray-900">Frameworks</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage ESG frameworks, standards, and regulations
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Framework
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search frameworks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-40">
            <Select
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
          <div className="w-36">
            <Select
              options={REGION_OPTIONS}
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Acronym</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Governing Body</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-gray-500"
                  >
                    <BookOpen className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    No frameworks found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((fw) => (
                  <TableRow key={fw.id}>
                    <TableCell className="font-medium">{fw.name}</TableCell>
                    <TableCell className="text-sm text-gray-600 font-mono">
                      {fw.acronym || "--"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          TYPE_COLORS[fw.type] ?? "bg-gray-100 text-gray-800"
                        )}
                      >
                        {fw.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {fw.governing_body || "--"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {fw.region || "--"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          STATUS_COLORS[fw.status] ?? "bg-gray-100 text-gray-600"
                        )}
                      >
                        {fw.status ?? "active"}
                      </span>
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
                          <DropdownMenuItem onClick={() => openEdit(fw)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onClick={() => handleDelete(fw.id)}
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
              {editingId ? "Edit Framework" : "New Framework"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update framework details."
                : "Add a new framework, standard, or regulation."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="fw-name">Name</Label>
                <Input
                  id="fw-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Global Reporting Initiative"
                />
              </div>
              <div>
                <Label htmlFor="fw-acronym">Acronym</Label>
                <Input
                  id="fw-acronym"
                  value={form.acronym}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, acronym: e.target.value }))
                  }
                  placeholder="e.g. GRI"
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="fw-fullname">Full Name</Label>
              <Input
                id="fw-fullname"
                value={form.full_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, full_name: e.target.value }))
                }
                placeholder="Full official name"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Type</Label>
                <Select
                  options={TYPE_OPTIONS.filter((o) => o.value !== "")}
                  value={form.type}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      type: e.target.value as FrameworkType,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="fw-region">Region</Label>
                <Input
                  id="fw-region"
                  value={form.region}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, region: e.target.value }))
                  }
                  placeholder="e.g. Global, EU, US"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="fw-governing">Governing Body</Label>
              <Input
                id="fw-governing"
                value={form.governing_body}
                onChange={(e) =>
                  setForm((p) => ({ ...p, governing_body: e.target.value }))
                }
                placeholder="e.g. IFRS Foundation"
              />
            </div>
            <div>
              <Label htmlFor="fw-website">Website</Label>
              <Input
                id="fw-website"
                value={form.website}
                onChange={(e) =>
                  setForm((p) => ({ ...p, website: e.target.value }))
                }
                placeholder="https://example.org"
              />
            </div>
            <div>
              <Label htmlFor="fw-desc">Description</Label>
              <Textarea
                id="fw-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Brief description..."
                rows={3}
              />
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
