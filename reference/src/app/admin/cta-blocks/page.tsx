"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  Input,
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
  Megaphone,
  Loader2,
  GripVertical,
} from "lucide-react";

// ---------- types ----------
interface CtaBlock {
  id: string;
  name: string;
  slug: string;
  placement: string;
  heading: string;
  subheading: string | null;
  primary_button_text: string | null;
  primary_button_url: string | null;
  secondary_button_text: string | null;
  secondary_button_url: string | null;
  background_style: string;
  background_image_url: string | null;
  form_id: string | null;
  status: "draft" | "active" | "archived";
  sort_order: number;
}

// ---------- constants ----------
const PLACEMENT_OPTIONS = [
  { value: "homepage", label: "Homepage" },
  { value: "sidebar", label: "Sidebar" },
  { value: "footer", label: "Footer" },
  { value: "post-content", label: "Post Content" },
  { value: "inline", label: "Inline" },
  { value: "popup", label: "Popup" },
  { value: "banner", label: "Banner" },
];

const STYLE_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "gradient", label: "Gradient" },
  { value: "image", label: "Image Background" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  archived: "bg-red-100 text-red-700",
};

// ---------- component ----------
export default function CtaBlocksPage() {
  const [blocks, setBlocks] = useState<CtaBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [placement, setPlacement] = useState("homepage");
  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  const [primaryText, setPrimaryText] = useState("");
  const [primaryUrl, setPrimaryUrl] = useState("");
  const [secondaryText, setSecondaryText] = useState("");
  const [secondaryUrl, setSecondaryUrl] = useState("");
  const [bgStyle, setBgStyle] = useState("light");
  const [bgImage, setBgImage] = useState("");

  const fetchBlocks = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/cta-blocks");
      if (res.ok) {
        const json = await res.json();
        setBlocks(json.data);
      }
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const resetForm = () => {
    setName("");
    setSlug("");
    setPlacement("homepage");
    setHeading("");
    setSubheading("");
    setPrimaryText("");
    setPrimaryUrl("");
    setSecondaryText("");
    setSecondaryUrl("");
    setBgStyle("light");
    setBgImage("");
    setEditingId(null);
  };

  const openNew = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEdit = (block: CtaBlock) => {
    setName(block.name);
    setSlug(block.slug);
    setPlacement(block.placement);
    setHeading(block.heading);
    setSubheading(block.subheading ?? "");
    setPrimaryText(block.primary_button_text ?? "");
    setPrimaryUrl(block.primary_button_url ?? "");
    setSecondaryText(block.secondary_button_text ?? "");
    setSecondaryUrl(block.secondary_button_url ?? "");
    setBgStyle(block.background_style);
    setBgImage(block.background_image_url ?? "");
    setEditingId(block.id);
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      placement,
      heading,
      subheading: subheading || null,
      primary_button_text: primaryText || null,
      primary_button_url: primaryUrl || null,
      secondary_button_text: secondaryText || null,
      secondary_button_url: secondaryUrl || null,
      background_style: bgStyle,
      background_image_url: bgImage || null,
      status: "draft",
    };

    try {
      const url = editingId
        ? `/api/admin/cta-blocks/${editingId}`
        : "/api/admin/cta-blocks";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowDialog(false);
        resetForm();
        fetchBlocks();
      }
    } catch {
      // Error handling
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/cta-blocks/${id}`, { method: "DELETE" });
      fetchBlocks();
    } catch {
      // Error handling
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CTA Blocks</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage call-to-action sections across the site
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          New CTA Block
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Name</TableHead>
                <TableHead>Heading</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead>Style</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-gray-500">
                    <Megaphone className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    No CTA blocks yet. Create your first call-to-action.
                  </TableCell>
                </TableRow>
              ) : (
                blocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-gray-300" />
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{block.name}</span>
                        <p className="text-xs text-gray-400">/{block.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-gray-600">
                      {block.heading}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{block.placement}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{block.background_style}</Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          STATUS_COLORS[block.status]
                        )}
                      >
                        {block.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(block)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onClick={() => handleDelete(block.id)}
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit CTA Block" : "New CTA Block"}</DialogTitle>
            <DialogDescription>
              Configure the call-to-action content and appearance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cta-name">Block Name</Label>
                <Input
                  id="cta-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Homepage Hero CTA"
                />
              </div>
              <div>
                <Label htmlFor="cta-slug">Slug</Label>
                <Input
                  id="cta-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Placement</Label>
                <Select
                  options={PLACEMENT_OPTIONS}
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value)}
                />
              </div>
              <div>
                <Label>Background Style</Label>
                <Select
                  options={STYLE_OPTIONS}
                  value={bgStyle}
                  onChange={(e) => setBgStyle(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cta-heading">Heading</Label>
              <Input
                id="cta-heading"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="Get Your Free ESG Score"
              />
            </div>

            <div>
              <Label htmlFor="cta-sub">Subheading</Label>
              <Input
                id="cta-sub"
                value={subheading}
                onChange={(e) => setSubheading(e.target.value)}
                placeholder="Supporting text..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Primary Button Text</Label>
                <Input
                  value={primaryText}
                  onChange={(e) => setPrimaryText(e.target.value)}
                  placeholder="Start Now"
                />
              </div>
              <div>
                <Label>Primary Button URL</Label>
                <Input
                  value={primaryUrl}
                  onChange={(e) => setPrimaryUrl(e.target.value)}
                  placeholder="/score"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Secondary Button Text</Label>
                <Input
                  value={secondaryText}
                  onChange={(e) => setSecondaryText(e.target.value)}
                  placeholder="Learn More"
                />
              </div>
              <div>
                <Label>Secondary Button URL</Label>
                <Input
                  value={secondaryUrl}
                  onChange={(e) => setSecondaryUrl(e.target.value)}
                  placeholder="/about"
                />
              </div>
            </div>

            {(bgStyle === "image" || bgStyle === "gradient") && (
              <div>
                <Label htmlFor="bg-img">Background Image URL</Label>
                <Input
                  id="bg-img"
                  value={bgImage}
                  onChange={(e) => setBgImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || !heading.trim() || saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingId ? (
                "Save Changes"
              ) : (
                "Create Block"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
