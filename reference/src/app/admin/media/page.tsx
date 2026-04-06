"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
} from "@/components/ui/shadcn";
import { cn } from "@/lib/utils";
import {
  Upload,
  Grid,
  List,
  Image as ImageIcon,
  File,
  Trash2,
  Copy,
  X,
  HardDrive,
} from "lucide-react";

// TODO: Wire to API for fetching/uploading/deleting media
// Sample data shape:
// const sampleMedia: MediaItem[] = [
//   { id: "1", filename: "hero-banner.jpg", url: "/uploads/hero-banner.jpg", mimetype: "image/jpeg", size: 245000, alt_text: "", caption: "", created_at: "2025-12-01T10:00:00Z" },
// ];

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetch("/api/admin/media")
      .then((res) => res.json())
      .then((json) => { setItems(json.data ?? []); })
      .catch(() => { /* silently handle - empty list is fine */ })
      .finally(() => setLoading(false));
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalFiles = items.length;
  const totalSize = items.reduce((acc, item) => acc + item.size, 0);

  function openDetail(item: MediaItem) {
    setSelectedItem(item);
    setEditAlt(item.alt_text);
    setEditCaption(item.caption);
  }

  function closeDetail() {
    setSelectedItem(null);
  }

  function handleSaveDetail() {
    if (!selectedItem) return;
    // TODO: Call API to update alt_text and caption
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? { ...item, alt_text: editAlt, caption: editCaption }
          : item
      )
    );
    closeDetail();
  }

  function handleDelete(itemId: string) {
    fetch(`/api/admin/media/${itemId}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) {
          setItems((prev) => prev.filter((item) => item.id !== itemId));
          closeDetail();
        }
      })
      .catch(() => { /* silently handle */ });
  }

  function handleCopyUrl(url: string) {
    navigator.clipboard.writeText(url);
    // TODO: Show toast
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
    const files = Array.from(e.dataTransfer.files);
    // TODO: Upload files via API
    console.log("Dropped files:", files);
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    // TODO: Upload files via API
    console.log("Selected files:", files);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">
            Upload and manage images, documents, and other media files.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Storage Stats */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <File className="h-4 w-4" />
          <span>{totalFiles} files</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HardDrive className="h-4 w-4" />
          <span>{formatFileSize(totalSize)} total</span>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <Upload className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-2 text-sm font-medium">
          Drag and drop files here, or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Supports images, PDFs, and documents up to 10MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Media Items */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No media files</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload your first file using the area above.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => openDetail(item)}
              className="group cursor-pointer overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
            >
              <div className="aspect-square bg-muted">
                {isImage(item.mimetype) ? (
                  <img
                    src={item.url}
                    alt={item.alt_text || item.filename}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <File className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium">{item.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(item.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left text-sm font-medium">File</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Type</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Size</th>
                <th className="px-4 py-2 text-left text-sm font-medium">
                  Uploaded
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => openDetail(item)}
                  className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-muted">
                        {isImage(item.mimetype) ? (
                          <img
                            src={item.url}
                            alt={item.alt_text || item.filename}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <File className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium">{item.filename}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">
                    {item.mimetype}
                  </td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">
                    {formatFileSize(item.size)}
                  </td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">
                    {formatDate(item.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => closeDetail()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedItem?.filename}</DialogTitle>
            <DialogDescription>
              {selectedItem &&
                `${formatFileSize(selectedItem.size)} - Uploaded ${formatDate(selectedItem.created_at)}`}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="overflow-hidden rounded-lg border bg-muted">
                {isImage(selectedItem.mimetype) ? (
                  <img
                    src={selectedItem.url}
                    alt={editAlt || selectedItem.filename}
                    className="max-h-64 w-full object-contain"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center">
                    <File className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* Edit Fields */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="alt_text">Alt Text</Label>
                  <Input
                    id="alt_text"
                    placeholder="Describe this image for accessibility"
                    value={editAlt}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditAlt(e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    placeholder="Optional caption"
                    value={editCaption}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditCaption(e.target.value)
                    }
                    className="min-h-[60px]"
                  />
                </div>
              </div>

              {/* URL */}
              <div className="flex items-center gap-2">
                <Input value={selectedItem.url} readOnly className="text-xs" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyUrl(selectedItem.url)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => selectedItem && handleDelete(selectedItem.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeDetail}>
                Cancel
              </Button>
              <Button onClick={handleSaveDetail}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
