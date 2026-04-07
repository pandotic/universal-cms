"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Textarea,
  Label,
  Button,
  Badge,
  Select,
  Separator,
} from "@/components/ui/shadcn";
import { cn } from "@/lib/utils";
import {
  GripVertical,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Send,
  X,
  Image as ImageIcon,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ---------- types ----------
interface ListicleItem {
  id: string;
  custom_title: string;
  custom_description: string;
  label: string;
  pros: string[];
  cons: string[];
  affiliate_url: string;
}

interface ListicleData {
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  seo_title: string;
  seo_description: string;
  og_image: string;
  status: "draft" | "published";
  items: ListicleItem[];
}

const LABEL_OPTIONS = [
  { value: "", label: "No label" },
  { value: "best_overall", label: "Best Overall" },
  { value: "best_value", label: "Best Value" },
  { value: "runner_up", label: "Runner Up" },
  { value: "budget_pick", label: "Budget Pick" },
  { value: "premium_pick", label: "Premium Pick" },
  { value: "editors_choice", label: "Editor's Choice" },
];

const LABEL_COLORS: Record<string, string> = {
  best_overall: "bg-emerald-100 text-emerald-800",
  best_value: "bg-blue-100 text-blue-800",
  runner_up: "bg-purple-100 text-purple-800",
  budget_pick: "bg-amber-100 text-amber-800",
  premium_pick: "bg-indigo-100 text-indigo-800",
  editors_choice: "bg-rose-100 text-rose-800",
};

const EMPTY_LISTICLE: ListicleData = {
  title: "",
  slug: "",
  subtitle: "",
  description: "",
  seo_title: "",
  seo_description: "",
  og_image: "",
  status: "draft",
  items: [],
};

// ---------- sortable item ----------
function SortableItem({
  item,
  index,
  onUpdate,
  onRemove,
  onAddChip,
  onRemoveChip,
}: {
  item: ListicleItem;
  index: number;
  onUpdate: (id: string, field: keyof ListicleItem, value: string) => void;
  onRemove: (id: string) => void;
  onAddChip: (id: string, field: "pros" | "cons", value: string) => void;
  onRemoveChip: (id: string, field: "pros" | "cons", chipIndex: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [proInput, setProInput] = useState("");
  const [conInput, setConInput] = useState("");

  const handleProKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && proInput.trim()) {
      e.preventDefault();
      onAddChip(item.id, "pros", proInput.trim());
      setProInput("");
    }
  };

  const handleConKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && conInput.trim()) {
      e.preventDefault();
      onAddChip(item.id, "cons", conInput.trim());
      setConInput("");
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-4",
        isDragging && "shadow-lg ring-2 ring-blue-200 opacity-90"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Position number */}
        <div className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-gray-500">Title</Label>
              <Input
                value={item.custom_title}
                onChange={(e) => onUpdate(item.id, "custom_title", e.target.value)}
                placeholder="Item title"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs text-gray-500">Label</Label>
                <Select
                  options={LABEL_OPTIONS}
                  value={item.label}
                  onChange={(e) => onUpdate(item.id, "label", e.target.value)}
                />
              </div>
              {item.label && (
                <div className="mt-5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      LABEL_COLORS[item.label] || "bg-gray-100 text-gray-800"
                    )}
                  >
                    {LABEL_OPTIONS.find((o) => o.value === item.label)?.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-500">Description</Label>
            <Textarea
              value={item.custom_description}
              onChange={(e) =>
                onUpdate(item.id, "custom_description", e.target.value)
              }
              placeholder="Item description"
              rows={2}
            />
          </div>

          {/* Pros / Cons chips */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-gray-500">Pros (Enter to add)</Label>
              <Input
                value={proInput}
                onChange={(e) => setProInput(e.target.value)}
                onKeyDown={handleProKeyDown}
                placeholder="Add a pro..."
                className="mb-1.5"
              />
              <div className="flex flex-wrap gap-1">
                {item.pros.map((p, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700"
                  >
                    {p}
                    <button
                      onClick={() => onRemoveChip(item.id, "pros", i)}
                      className="ml-0.5 rounded-full hover:bg-green-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Cons (Enter to add)</Label>
              <Input
                value={conInput}
                onChange={(e) => setConInput(e.target.value)}
                onKeyDown={handleConKeyDown}
                placeholder="Add a con..."
                className="mb-1.5"
              />
              <div className="flex flex-wrap gap-1">
                {item.cons.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
                  >
                    {c}
                    <button
                      onClick={() => onRemoveChip(item.id, "cons", i)}
                      className="ml-0.5 rounded-full hover:bg-red-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-500">Affiliate URL</Label>
            <Input
              value={item.affiliate_url}
              onChange={(e) =>
                onUpdate(item.id, "affiliate_url", e.target.value)
              }
              placeholder="https://affiliate.example.com/..."
            />
          </div>
        </div>

        {/* Remove button */}
        <button
          onClick={() => onRemove(item.id)}
          className="mt-2 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------- main component ----------
export default function ListicleEditorPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<ListicleData>(EMPTY_LISTICLE);
  const [loading, setLoading] = useState(id !== "new");

  useEffect(() => {
    if (id === "new") return;
    fetch(`/api/admin/listicles/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setData(json.data);
      })
      .catch(() => { /* silently handle */ })
      .finally(() => setLoading(false));
  }, [id]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateField = (field: keyof Omit<ListicleData, "items" | "status">, value: string) => {
    setData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "title") {
        next.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      return next;
    });
  };

  const updateItem = (itemId: string, field: keyof ListicleItem, value: string) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === itemId ? { ...it, [field]: value } : it
      ),
    }));
  };

  const removeItem = (itemId: string) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== itemId),
    }));
  };

  const addItem = () => {
    const newItem: ListicleItem = {
      id: `item-${Date.now()}`,
      custom_title: "",
      custom_description: "",
      label: "",
      pros: [],
      cons: [],
      affiliate_url: "",
    };
    setData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const addChip = (itemId: string, field: "pros" | "cons", value: string) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === itemId ? { ...it, [field]: [...it[field], value] } : it
      ),
    }));
  };

  const removeChip = (itemId: string, field: "pros" | "cons", chipIndex: number) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === itemId
          ? { ...it, [field]: it[field].filter((_, i) => i !== chipIndex) }
          : it
      ),
    }));
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setData((prev) => {
          const oldIndex = prev.items.findIndex((it) => it.id === active.id);
          const newIndex = prev.items.findIndex((it) => it.id === over.id);
          return { ...prev, items: arrayMove(prev.items, oldIndex, newIndex) };
        });
      }
    },
    []
  );

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
        <div className="flex items-center gap-3">
          <Link href="/admin/listicles">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {id === "new" ? "New Listicle" : "Edit Listicle"}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {id === "new"
                ? "Create a new ranked list"
                : `Editing: ${data.title || "Untitled"}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const payload = { ...data, status: "draft" as const };
              setData(payload);
              const url = id === "new" ? "/api/admin/listicles" : `/api/admin/listicles/${id}`;
              const method = id === "new" ? "POST" : "PUT";
              fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              }).catch(() => { /* silently handle */ });
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => {
              const payload = { ...data, status: "published" as const };
              setData(payload);
              const url = id === "new" ? "/api/admin/listicles" : `/api/admin/listicles/${id}`;
              const method = id === "new" ? "POST" : "PUT";
              fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              }).catch(() => { /* silently handle */ });
            }}
          >
            <Send className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Title, slug, and introductory content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Best ESG ETFs for 2026"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug (auto-generated)</Label>
              <Input
                id="slug"
                value={data.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="best-esg-etfs-2026"
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={data.subtitle}
              onChange={(e) => updateField("subtitle", e.target.value)}
              placeholder="A brief subtitle for the listicle"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Describe the purpose and scope of this listicle..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
          <CardDescription>Search engine optimization metadata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="seo_title">SEO Title</Label>
            <Input
              id="seo_title"
              value={data.seo_title}
              onChange={(e) => updateField("seo_title", e.target.value)}
              placeholder="SEO-friendly title (50-60 chars)"
            />
            <p className="mt-1 text-xs text-gray-400">
              {data.seo_title.length}/60 characters
            </p>
          </div>
          <div>
            <Label htmlFor="seo_description">SEO Description</Label>
            <Textarea
              id="seo_description"
              value={data.seo_description}
              onChange={(e) => updateField("seo_description", e.target.value)}
              placeholder="Meta description (150-160 chars)"
              rows={2}
            />
            <p className="mt-1 text-xs text-gray-400">
              {data.seo_description.length}/160 characters
            </p>
          </div>
          <div>
            <Label htmlFor="og_image">OG Image URL</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="og_image"
                  value={data.og_image}
                  onChange={(e) => updateField("og_image", e.target.value)}
                  placeholder="https://images.example.com/og-image.jpg"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items (drag-and-drop) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Items ({data.items.length})</CardTitle>
              <CardDescription>
                Drag to reorder. Each item represents a ranked entry in the listicle.
              </CardDescription>
            </div>
            <Button onClick={addItem} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
              <p className="text-sm text-gray-500">No items yet</p>
              <Button onClick={addItem} variant="outline" size="sm" className="mt-3">
                <Plus className="mr-2 h-4 w-4" />
                Add First Item
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={data.items.map((it) => it.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {data.items.map((item, index) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      index={index}
                      onUpdate={updateItem}
                      onRemove={removeItem}
                      onAddChip={addChip}
                      onRemoveChip={removeChip}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {data.items.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Button onClick={addItem} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
