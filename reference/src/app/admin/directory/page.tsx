"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  Input,
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
  Star,
  StarOff,
  Send,
  Archive,
  FileText,
  Building2,
} from "lucide-react";

// ---------- types ----------
type EntityStatus = "published" | "draft" | "archived";
type EntityType = "vendor" | "organization" | "regulator" | "standard-body";

interface Entity {
  id: string;
  name: string;
  slug: string;
  type: EntityType;
  categories: string[];
  status: EntityStatus;
  featured: boolean;
  logo_url?: string;
  updated_at: string;
}

// ---------- constants ----------
const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "vendor", label: "Vendor" },
  { value: "organization", label: "Organization" },
  { value: "regulator", label: "Regulator" },
  { value: "standard-body", label: "Standard Body" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const STATUS_COLORS: Record<EntityStatus, string> = {
  published: "bg-green-100 text-green-800",
  draft: "bg-yellow-100 text-yellow-800",
  archived: "bg-gray-100 text-gray-600",
};

const TYPE_COLORS: Record<EntityType, string> = {
  vendor: "bg-indigo-100 text-indigo-800",
  organization: "bg-rose-100 text-rose-800",
  regulator: "bg-amber-100 text-amber-800",
  "standard-body": "bg-teal-100 text-teal-800",
};

// ---------- component ----------
export default function DirectoryPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/taxonomy/entities")
      .then((res) => res.json())
      .then((json) => {
        setEntities(json.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = entities.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || e.type === typeFilter;
    const matchesStatus = !statusFilter || e.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalCount = entities.length;
  const featuredCount = entities.filter((e) => e.featured).length;
  const typeCounts = entities.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this entity?")) return;
    setEntities((prev) => prev.filter((e) => e.id !== id));
    fetch(`/api/admin/taxonomy/entities/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const handleToggleFeatured = (id: string) => {
    setEntities((prev) =>
      prev.map((e) => (e.id === id ? { ...e, featured: !e.featured } : e))
    );
    const entity = entities.find((e) => e.id === id);
    if (entity) {
      fetch(`/api/admin/taxonomy/entities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !entity.featured }),
      }).catch(() => {});
    }
  };

  const handleSetStatus = (id: string, status: EntityStatus) => {
    setEntities((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
    fetch(`/api/admin/taxonomy/entities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  };

  const statCards = [
    {
      label: "Total Entities",
      value: totalCount.toString(),
      icon: Building2,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Featured",
      value: featuredCount.toString(),
      icon: Star,
      color: "text-amber-600 bg-amber-50",
    },
    ...Object.entries(typeCounts).map(([type, count]) => ({
      label: type.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: count.toString(),
      icon: FileText,
      color: "text-gray-600 bg-gray-50",
    })),
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">
            Directory &mdash; Entities
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage directory entities and their metadata
          </p>
        </div>
        <Link href="/admin/directory/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Entity
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn("rounded-lg p-2.5", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-44">
            <Select
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
                <TableHead>Type</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Featured</TableHead>
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
                    <Building2 className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    No entities found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                        <Link
                          href={`/admin/directory/${entity.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                        >
                          {entity.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          TYPE_COLORS[entity.type] ?? "bg-gray-100 text-gray-800"
                        )}
                      >
                        {entity.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(entity.categories ?? []).slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                          >
                            {cat}
                          </span>
                        ))}
                        {(entity.categories ?? []).length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{entity.categories.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          STATUS_COLORS[entity.status]
                        )}
                      >
                        {entity.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleFeatured(entity.id)}
                        className="rounded p-1 hover:bg-gray-100"
                      >
                        {entity.featured ? (
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ) : (
                          <StarOff className="h-4 w-4 text-gray-300" />
                        )}
                      </button>
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
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/directory/${entity.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleFeatured(entity.id)}
                          >
                            <Star className="mr-2 h-4 w-4" />
                            {entity.featured
                              ? "Remove Featured"
                              : "Set Featured"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {entity.status !== "published" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleSetStatus(entity.id, "published")
                              }
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Set Published
                            </DropdownMenuItem>
                          )}
                          {entity.status !== "draft" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleSetStatus(entity.id, "draft")
                              }
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Set Draft
                            </DropdownMenuItem>
                          )}
                          {entity.status !== "archived" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleSetStatus(entity.id, "archived")
                              }
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Set Archived
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onClick={() => handleDelete(entity.id)}
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
    </div>
  );
}
