"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Select,
  Switch,
  Textarea,
} from "@/components/ui/shadcn";
import { Plus, Pencil, Trash2, Upload, ArrowRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Redirect {
  id: string;
  from_path: string;
  to_path: string;
  redirect_type: 301 | 302 | 307;
  is_regex: boolean;
  hits: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

type RedirectFormData = {
  from_path: string;
  to_path: string;
  redirect_type: "301" | "302" | "307";
  is_regex: boolean;
  is_active: boolean;
  notes: string;
};

const DEFAULT_FORM: RedirectFormData = {
  from_path: "",
  to_path: "",
  redirect_type: "301",
  is_regex: false,
  is_active: true,
  notes: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function typeBadge(type: number) {
  const colors: Record<number, string> = {
    301: "bg-blue-100 text-blue-700",
    302: "bg-yellow-100 text-yellow-700",
    307: "bg-purple-100 text-purple-700",
  };
  return (
    <Badge className={`text-xs ${colors[type] ?? "bg-gray-100 text-gray-700"}`}>
      {type}
    </Badge>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Modal form
// ---------------------------------------------------------------------------

function RedirectModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: RedirectFormData & { id?: string };
  onSave: (data: RedirectFormData, id?: string) => Promise<void>;
}) {
  const [form, setForm] = useState<RedirectFormData>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initial);
    setError(null);
  }, [initial, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.from_path.trim() || !form.to_path.trim()) {
      setError("From and To paths are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form, initial.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save redirect");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial.id ? "Edit Redirect" : "Add Redirect"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="from_path">From Path</Label>
            <Input
              id="from_path"
              placeholder="/old-page"
              value={form.from_path}
              onChange={(e) => setForm((f) => ({ ...f, from_path: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to_path">To Path / URL</Label>
            <Input
              id="to_path"
              placeholder="/new-page or https://example.com/page"
              value={form.to_path}
              onChange={(e) => setForm((f) => ({ ...f, to_path: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="redirect_type">Type</Label>
              <select
                id="redirect_type"
                value={form.redirect_type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    redirect_type: e.target.value as "301" | "302" | "307",
                  }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="301">301 — Permanent</option>
                <option value="302">302 — Temporary</option>
                <option value="307">307 — Temporary (preserve method)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Options</Label>
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.is_regex}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, is_regex: v }))}
                  />
                  Regex pattern
                </label>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Why this redirect exists…"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : initial.id ? "Save Changes" : "Create Redirect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// CSV import modal
// ---------------------------------------------------------------------------

function CsvImportModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [csv, setCsv] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; errors: string[] } | null>(null);

  useEffect(() => {
    if (!open) {
      setCsv("");
      setResult(null);
    }
  }, [open]);

  async function handleImport() {
    setImporting(true);
    setResult(null);
    let ok = 0;
    const errors: string[] = [];
    const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);

    for (const line of lines) {
      // skip header row
      if (line.toLowerCase().startsWith("from")) continue;
      const parts = line.split(",");
      if (parts.length < 2) {
        errors.push(`Skipped (bad format): ${line}`);
        continue;
      }
      const [from, to, type] = parts;
      const redirectType = parseInt(type ?? "301", 10);
      if (!from || !to) {
        errors.push(`Skipped (missing from/to): ${line}`);
        continue;
      }
      try {
        const res = await fetch("/api/admin/redirects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from_path: from.trim(),
            to_path: to.trim(),
            redirect_type: [301, 302, 307].includes(redirectType) ? redirectType : 301,
          }),
        });
        if (!res.ok) {
          const j = await res.json();
          errors.push(`${from}: ${j.error ?? "unknown error"}`);
        } else {
          ok++;
        }
      } catch {
        errors.push(`${from}: network error`);
      }
    }

    setResult({ ok, errors });
    setImporting(false);
    if (ok > 0) onImported();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Redirects from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Paste CSV rows in <code className="rounded bg-muted px-1 py-0.5 text-xs">from,to,type</code> format. The type column is optional (defaults to 301).
          </p>
          <Textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={`from,to,type\n/old-page,/new-page,301\n/another,/destination`}
            rows={8}
            className="font-mono text-xs"
          />
          {result && (
            <div className="rounded-md border p-3 text-sm space-y-1">
              <p className="font-medium text-green-700">{result.ok} redirect{result.ok !== 1 ? "s" : ""} imported.</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-red-600 text-xs">{e}</p>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={importing}>
            Close
          </Button>
          <Button onClick={handleImport} disabled={importing || !csv.trim()}>
            {importing ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Inner page (reads search params)
// ---------------------------------------------------------------------------

function RedirectsPageInner() {
  const searchParams = useSearchParams();
  const prefillFrom = searchParams.get("from") ?? "";

  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<(RedirectFormData & { id?: string }) | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRedirects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/redirects");
      const json = await res.json();
      setRedirects(json.data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRedirects();
  }, [loadRedirects]);

  // Pre-open modal if arriving from broken-links / 404 page
  useEffect(() => {
    if (prefillFrom) {
      setEditTarget({
        ...DEFAULT_FORM,
        from_path: prefillFrom,
      });
      setModalOpen(true);
    }
  }, [prefillFrom]);

  function openCreate() {
    setEditTarget({ ...DEFAULT_FORM });
    setModalOpen(true);
  }

  function openEdit(r: Redirect) {
    setEditTarget({
      id: r.id,
      from_path: r.from_path,
      to_path: r.to_path,
      redirect_type: String(r.redirect_type) as "301" | "302" | "307",
      is_regex: r.is_regex,
      is_active: r.is_active,
      notes: r.notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave(form: RedirectFormData, id?: string) {
    const payload = {
      from_path: form.from_path,
      to_path: form.to_path,
      redirect_type: parseInt(form.redirect_type, 10),
      is_regex: form.is_regex,
      is_active: form.is_active,
      notes: form.notes || null,
    };

    if (id) {
      const res = await fetch(`/api/admin/redirects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Failed to update redirect");
      }
    } else {
      const res = await fetch("/api/admin/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Failed to create redirect");
      }
    }
    await loadRedirects();
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await fetch(`/api/admin/redirects/${id}`, { method: "DELETE" });
      await loadRedirects();
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  async function toggleActive(r: Redirect) {
    await fetch(`/api/admin/redirects/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !r.is_active }),
    });
    await loadRedirects();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Redirect Manager</h1>
          <p className="text-muted-foreground mt-1">
            Manage 301/302/307 redirects applied at the edge by middleware.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCsvOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button
            onClick={openCreate}
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Redirect
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Redirect Rules
            {redirects.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({redirects.length} total, {redirects.filter((r) => r.is_active).length} active)
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Rules are checked in order. Regex patterns are supported when the Regex toggle is enabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : redirects.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No redirect rules yet.{" "}
              <button className="text-blue-600 hover:underline" onClick={openCreate}>
                Add the first one.
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>
                      <span className="sr-only">Arrow</span>
                    </TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Hits</TableHead>
                    <TableHead>Regex</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redirects.map((r) => (
                    <TableRow
                      key={r.id}
                      className={!r.is_active ? "opacity-50" : ""}
                    >
                      <TableCell className="font-mono text-xs max-w-[180px]">
                        <span className="break-all">{r.from_path}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <ArrowRight className="h-3 w-3" />
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[180px]">
                        <span className="break-all text-green-700">{r.to_path}</span>
                      </TableCell>
                      <TableCell>{typeBadge(r.redirect_type)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {r.hits.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {r.is_regex ? (
                          <Badge className="bg-orange-100 text-orange-700 text-xs">regex</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={r.is_active}
                          onCheckedChange={() => toggleActive(r)}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {fmtDate(r.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(r)}
                            className="h-7 w-7 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(r.id)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit modal */}
      {editTarget && (
        <RedirectModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditTarget(null);
          }}
          initial={editTarget}
          onSave={handleSave}
        />
      )}

      {/* CSV import modal */}
      <CsvImportModal
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        onImported={loadRedirects}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Redirect?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will permanently remove the redirect rule. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export — wrap in Suspense for useSearchParams
// ---------------------------------------------------------------------------

export default function RedirectsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
      <RedirectsPageInner />
    </Suspense>
  );
}
