"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Button,
  Input,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Select,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Card,
  CardContent,
} from "@pandotic/universal-cms/components/ui";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  ExternalLink,
  Archive,
  Trash2,
  Send,
  FileText,
} from "lucide-react";

type PageType = "article" | "guide" | "landing" | "custom";
type PageStatus = "draft" | "published" | "archived";

interface ContentPage {
  id: string;
  title: string;
  slug: string;
  page_type: PageType;
  status: PageStatus;
  created_at: string;
}

const PAGE_TYPE_LABELS: Record<PageType, string> = {
  article: "Article",
  guide: "Guide",
  landing: "Landing",
  custom: "Custom",
};

const STATUS_VARIANT: Record<PageStatus, "secondary" | "success" | "outline"> = {
  draft: "secondary",
  published: "success",
  archived: "outline",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ContentPagesPage() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PageStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<PageType | "all">("all");

  useEffect(() => {
    fetch("/api/admin/content-pages")
      .then((res) => res.json())
      .then((json) => { setPages(json.data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const matchesSearch =
        !searchQuery ||
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || page.status === statusFilter;
      const matchesType = typeFilter === "all" || page.page_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [pages, searchQuery, statusFilter, typeFilter]);

  function handleStatusChange(pageId: string, newStatus: PageStatus) {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, status: newStatus } : p))
    );
  }

  function handleDelete(pageId: string) {
    fetch(`/api/admin/content-pages/${pageId}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) {
          setPages((prev) => prev.filter((p) => p.id !== pageId));
        }
      })
      .catch(() => {});
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-foreground-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Pages</h1>
          <p className="text-foreground-secondary">
            Manage articles, guides, landing pages, and custom content.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/content-pages/new">
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
          <Input
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setStatusFilter(e.target.value as PageStatus | "all")
          }
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
        <Select
          value={typeFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setTypeFilter(e.target.value as PageType | "all")
          }
        >
          <option value="all">All Types</option>
          <option value="article">Article</option>
          <option value="guide">Guide</option>
          <option value="landing">Landing</option>
          <option value="custom">Custom</option>
        </Select>
      </div>

      {/* Table / Empty State */}
      {filteredPages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-foreground-tertiary" />
            <h3 className="mt-4 text-lg font-semibold">No pages found</h3>
            <p className="mt-1 text-sm text-foreground-secondary">
              {pages.length === 0
                ? "Get started by creating your first content page."
                : "No pages match your current filters."}
            </p>
            {pages.length === 0 && (
              <Button asChild className="mt-4">
                <Link href="/admin/content-pages/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Page
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <Link
                      href={`/admin/content-pages/${page.id}`}
                      className="font-medium hover:underline"
                    >
                      {page.title}
                    </Link>
                    <p className="text-xs text-foreground-tertiary">/{page.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {PAGE_TYPE_LABELS[page.page_type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[page.status]}>
                      {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground-secondary">
                    {formatDate(page.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/content-pages/${page.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        {page.status === "published" && (
                          <DropdownMenuItem asChild>
                            <Link href={`/${page.slug}`} target="_blank">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View on Site
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {page.status === "draft" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(page.id, "published")}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        {page.status === "published" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(page.id, "archived")}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        {page.status === "archived" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(page.id, "draft")}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Move to Draft
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(page.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
