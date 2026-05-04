"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type MediaItem,
  deleteMedia,
  getAllMedia,
  getMediaPublicUrl,
  updateMedia,
  uploadMedia,
} from "../../../data/media.js";
import { cn } from "../../../utils/index.js";
import {
  Field,
  GhostButton,
  PanelEmpty,
  PanelError,
  PanelHeading,
  PanelSpinner,
  PrimaryButton,
  inputClass,
} from "./_shared.js";

export interface MediaLibraryPanelProps {
  supabase: SupabaseClient;
  /** Storage bucket name. Falls back to "media". */
  bucket?: string;
  /** Public Supabase URL — used to build public URLs for thumbnails. */
  supabaseUrl?: string;
  /** Optional uploader id stamped onto rows (e.g. current user id). */
  uploadedBy?: string;
  /** Max upload size in MB (defaults to 10). Soft-enforced before the
   * Supabase Storage call to give a clearer error. */
  maxFileSizeMb?: number;
}

/**
 * Media Library — uploads files to Supabase Storage, indexes them in the
 * `content_media` table, and renders a grid of thumbnails (images) +
 * file rows (everything else). Click a row to edit alt text + caption.
 */
export function MediaLibraryPanel({
  supabase,
  bucket = "media",
  supabaseUrl,
  uploadedBy,
  maxFileSizeMb = 10,
}: MediaLibraryPanelProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const resolvedSupabaseUrl = useMemo(
    () =>
      supabaseUrl ??
      (typeof process !== "undefined"
        ? process.env.NEXT_PUBLIC_SUPABASE_URL
        : undefined) ??
      "",
    [supabaseUrl],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getAllMedia(supabase));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of list) {
        if (file.size > maxFileSizeMb * 1024 * 1024) {
          throw new Error(
            `${file.name} exceeds ${maxFileSizeMb}MB upload limit`,
          );
        }
        await uploadMedia(supabase, file, bucket, undefined, undefined, uploadedBy);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Delete ${item.filename}?`)) return;
    try {
      await deleteMedia(supabase, item.id, bucket);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  }

  if (editing) {
    return (
      <MediaItemEditor
        item={editing}
        bucket={bucket}
        supabaseUrl={resolvedSupabaseUrl}
        supabase={supabase}
        onSaved={() => {
          setEditing(null);
          refresh();
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PanelHeading
        title="Media Library"
        description={`${items.length} files · bucket "${bucket}" · max ${maxFileSizeMb}MB per upload`}
        actions={
          <PrimaryButton
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Upload files"}
          </PrimaryButton>
        }
      />
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={onPick}
      />

      <PanelError message={error} />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-lg border border-dashed p-6 text-center text-sm transition-colors",
          dragOver
            ? "border-foreground bg-surface-secondary text-foreground"
            : "border-border text-foreground-tertiary",
        )}
      >
        Drag &amp; drop files here, or use the Upload button above.
      </div>

      {loading ? (
        <PanelSpinner />
      ) : items.length === 0 ? (
        <PanelEmpty>No media yet — upload your first file.</PanelEmpty>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              bucket={bucket}
              supabaseUrl={resolvedSupabaseUrl}
              onEdit={() => setEditing(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MediaCard({
  item,
  bucket,
  supabaseUrl,
  onEdit,
  onDelete,
}: {
  item: MediaItem;
  bucket: string;
  supabaseUrl: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isImage = (item.mime_type ?? "").startsWith("image/");
  const url = supabaseUrl
    ? getMediaPublicUrl(supabaseUrl, bucket, item.storage_path)
    : null;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <button
        type="button"
        onClick={onEdit}
        className="relative aspect-video w-full overflow-hidden bg-surface-secondary"
      >
        {isImage && url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={item.alt_text ?? item.filename}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-foreground-tertiary">
            {item.mime_type ?? "file"}
          </div>
        )}
      </button>
      <div className="space-y-1 p-3">
        <button
          type="button"
          onClick={onEdit}
          className="block w-full truncate text-left text-xs font-medium text-foreground hover:underline"
          title={item.filename}
        >
          {item.filename}
        </button>
        <p className="text-[10px] text-foreground-tertiary">
          {formatBytes(item.size_bytes)} · {formatDate(item.created_at)}
        </p>
        <div className="flex items-center justify-between pt-1">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-[10px] text-foreground-secondary hover:text-foreground"
            >
              Open ↗
            </a>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onDelete}
            className="text-[10px] text-foreground-tertiary hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function MediaItemEditor({
  item,
  bucket,
  supabaseUrl,
  supabase,
  onSaved,
  onCancel,
}: {
  item: MediaItem;
  bucket: string;
  supabaseUrl: string;
  supabase: SupabaseClient;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [altText, setAltText] = useState(item.alt_text ?? "");
  const [caption, setCaption] = useState(item.caption ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImage = (item.mime_type ?? "").startsWith("image/");
  const url = supabaseUrl
    ? getMediaPublicUrl(supabaseUrl, bucket, item.storage_path)
    : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateMedia(supabase, item.id, {
        alt_text: altText,
        caption,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GhostButton type="button" onClick={onCancel}>
          ← Back
        </GhostButton>
        <PanelHeading
          title={item.filename}
          description={`${formatBytes(item.size_bytes)} · ${item.mime_type ?? "unknown"} · ${formatDate(item.created_at)}`}
        />
      </div>

      <PanelError message={error} />

      <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-border bg-surface-secondary">
          {isImage && url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={altText || item.filename}
              className="h-auto w-full object-contain"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-foreground-tertiary">
              No preview available
            </div>
          )}
          {url && (
            <div className="border-t border-border p-3">
              <p className="break-all font-mono text-[11px] text-foreground-tertiary">
                {url}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Field label="Alt text" help="Describe the image for screen readers and SEO.">
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Caption">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>
          <div className="flex items-center gap-3 pt-2">
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </PrimaryButton>
            <GhostButton type="button" onClick={onCancel}>
              Cancel
            </GhostButton>
          </div>
        </div>
      </form>
    </div>
  );
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}
