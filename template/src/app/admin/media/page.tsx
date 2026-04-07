"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Input,
  Textarea,
  Badge,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
} from "@pandotic/universal-cms/components/ui";
import { cn } from "@pandotic/universal-cms/utils";
import {
  Upload,
  Grid,
  List,
  Image as ImageIcon,
  File,
  Trash2,
  Copy,
  HardDrive,
} from "lucide-react";

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
  alt_text: string;
  caption: string;
  created_at: string;
}

type ViewMode = "grid" | "list";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isImage(mimetype: string): boolean {
  return mimetype.startsWith("image/");
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetch("/api/admin/media")
      .then((res) => res.json())
      .then((json) => {
        setItems(json.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openDetail(item: MediaItem) {
    setSelectedItem(item);
    setEditAlt(item.alt_text);
    setEditCaption(item.caption);
  }

  function handleSaveDetail() {
    if (!selectedItem) return;
    fetch(`/api/admin/media/${selectedItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt_text: editAlt, caption: editCaption }),
    })
      .then((res) => {
        if (res.ok) {
          setItems((prev) =>
            prev.map((item) =>
              item.id === selectedItem.id
                ? { ...item, alt_text: editAlt, caption: editCaption }
                : item
            )
          );
          setSelectedItem(null);
        }
      })
      .catch(() => {});
  }

  function handleDelete(id: string) {
    fetch(`/api/admin/media/${id}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) {
          setItems((prev) => prev.filter((item) => item.id !== id));
          if (selectedItem?.id === id) setSelectedItem(null);
        }
      })
      .catch(() => {});
  }

  function handleCopyUrl(url: string) {
    navigator.clipboard.writeText(url).catch(() => {});
  }

  function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    fetch("/api/admin/media/upload", { method: "POST", body: formData })
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setItems((prev) => [...json.data, ...prev]);
        }
      })
      .catch(() => {});
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-foreground-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-foreground-secondary">
            Upload and manage images, documents, and other files.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <label>
            <Button asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </span>
            </Button>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border"
        )}
      >
        <Upload className="mx-auto h-8 w-8 text-foreground-tertiary" />
        <p className="mt-2 text-sm text-foreground-secondary">
          Drag and drop files here, or click Upload above
        </p>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <HardDrive className="h-12 w-12 text-foreground-tertiary" />
            <h3 className="mt-4 text-lg font-semibold">No media files</h3>
            <p className="mt-1 text-sm text-foreground-secondary">
              Upload your first file to get started.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
              onClick={() => openDetail(item)}
            >
              <div className="relative aspect-square bg-surface">
                {isImage(item.mimetype) ? (
                  <img
                    src={item.url}
                    alt={item.alt_text || item.filename}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <File className="h-12 w-12 text-foreground-tertiary" />
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <p className="truncate text-sm font-medium">{item.filename}</p>
                <p className="text-xs text-foreground-tertiary">
                  {formatBytes(item.size)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                  File
                </th>
                <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                  Size
                </th>
                <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                  Date
                </th>
                <th className="px-4 py-3 text-right font-medium text-foreground-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-surface"
                  onClick={() => openDetail(item)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {isImage(item.mimetype) ? (
                        <ImageIcon className="h-5 w-5 text-foreground-tertiary" />
                      ) : (
                        <File className="h-5 w-5 text-foreground-tertiary" />
                      )}
                      <span className="font-medium">{item.filename}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {item.mimetype}
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {formatBytes(item.size)}
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleCopyUrl(item.url);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={selectedItem !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Media Details</DialogTitle>
            <DialogDescription>
              View and edit metadata for this file.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {isImage(selectedItem.mimetype) ? (
                <div className="overflow-hidden rounded-md border border-border">
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.alt_text || selectedItem.filename}
                    className="max-h-64 w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-md border border-border py-8">
                  <File className="h-16 w-16 text-foreground-tertiary" />
                </div>
              )}
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Filename</span>
                  <span className="font-medium">{selectedItem.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Size</span>
                  <span>{formatBytes(selectedItem.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Type</span>
                  <span>{selectedItem.mimetype}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Uploaded</span>
                  <span>{formatDate(selectedItem.created_at)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="alt-text">Alt Text</Label>
                  <Input
                    id="alt-text"
                    value={editAlt}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditAlt(e.target.value)
                    }
                    placeholder="Describe this image for accessibility"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    value={editCaption}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditCaption(e.target.value)
                    }
                    placeholder="Optional caption"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyUrl(selectedItem?.url ?? "")}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy URL
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (selectedItem) handleDelete(selectedItem.id);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                  Delete
                </Button>
              </div>
              <Button onClick={handleSaveDetail}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
