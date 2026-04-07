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
  Eye,
  FileText,
  Inbox,
  Loader2,
} from "lucide-react";

// ---------- types ----------
type FormType = "contact" | "lead" | "newsletter" | "cta" | "custom";
type FormFieldType = "text" | "email" | "textarea" | "select" | "checkbox" | "radio" | "number" | "tel" | "url" | "hidden";
type FormStatus = "draft" | "active" | "archived";

interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

interface FormRecord {
  id: string;
  name: string;
  slug: string;
  form_type: FormType;
  description: string | null;
  fields: FormField[];
  settings: Record<string, unknown>;
  status: FormStatus;
  submission_count: number;
  created_at: string;
}

// ---------- constants ----------
const FORM_TYPE_OPTIONS = [
  { value: "contact", label: "Contact" },
  { value: "lead", label: "Lead Capture" },
  { value: "newsletter", label: "Newsletter" },
  { value: "cta", label: "CTA" },
  { value: "custom", label: "Custom" },
];

const FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio" },
  { value: "number", label: "Number" },
  { value: "tel", label: "Phone" },
  { value: "url", label: "URL" },
  { value: "hidden", label: "Hidden" },
];

const STATUS_COLORS: Record<FormStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  archived: "bg-red-100 text-red-700",
};

const TYPE_COLORS: Record<FormType, string> = {
  contact: "bg-blue-100 text-blue-700",
  lead: "bg-purple-100 text-purple-700",
  newsletter: "bg-teal-100 text-teal-700",
  cta: "bg-orange-100 text-orange-700",
  custom: "bg-gray-100 text-gray-700",
};

// ---------- component ----------
export default function FormsPage() {
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [formType, setFormType] = useState<FormType>("contact");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [submitLabel, setSubmitLabel] = useState("Submit");
  const [successMessage, setSuccessMessage] = useState("Thank you for your submission!");
  const [webhookUrl, setWebhookUrl] = useState("");

  const fetchForms = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/forms");
      if (res.ok) {
        const json = await res.json();
        setForms(json.data);
      }
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const resetForm = () => {
    setName("");
    setSlug("");
    setFormType("contact");
    setDescription("");
    setFields([]);
    setSubmitLabel("Submit");
    setSuccessMessage("Thank you for your submission!");
    setWebhookUrl("");
    setEditingId(null);
  };

  const openNew = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEdit = (form: FormRecord) => {
    setName(form.name);
    setSlug(form.slug);
    setFormType(form.form_type);
    setDescription(form.description ?? "");
    setFields(form.fields);
    setSubmitLabel((form.settings as { submitLabel?: string }).submitLabel ?? "Submit");
    setSuccessMessage((form.settings as { successMessage?: string }).successMessage ?? "");
    setWebhookUrl((form.settings as { webhookUrl?: string }).webhookUrl ?? "");
    setEditingId(form.id);
    setShowDialog(true);
  };

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { name: `field_${prev.length + 1}`, label: "", type: "text", required: false },
    ]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      form_type: formType,
      description: description || null,
      fields,
      settings: {
        submitLabel,
        successMessage,
        webhookUrl: webhookUrl || undefined,
        honeypotField: "_hp_check",
      },
      status: "draft" as FormStatus,
    };

    try {
      const url = editingId ? `/api/admin/forms/${editingId}` : "/api/admin/forms";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowDialog(false);
        resetForm();
        fetchForms();
      }
    } catch {
      // Error handling
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/forms/${id}`, { method: "DELETE" });
      fetchForms();
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
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage lead capture forms, contact forms, and newsletter signups
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Form
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead className="text-right">Submissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                    <Inbox className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    No forms yet. Create your first form to start capturing leads.
                  </TableCell>
                </TableRow>
              ) : (
                forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{form.name}</span>
                        <p className="text-xs text-gray-400">/{form.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          TYPE_COLORS[form.form_type]
                        )}
                      >
                        {form.form_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {form.fields.length} fields
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {form.submission_count}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          STATUS_COLORS[form.status]
                        )}
                      >
                        {form.status}
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
                          <DropdownMenuItem onClick={() => openEdit(form)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Submissions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onClick={() => handleDelete(form.id)}
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
            <DialogTitle>{editingId ? "Edit Form" : "New Form"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update your form configuration and fields."
                : "Create a new form with custom fields."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Basic info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="form-name">Form Name</Label>
                <Input
                  id="form-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Contact Us"
                />
              </div>
              <div>
                <Label htmlFor="form-slug">Slug</Label>
                <Input
                  id="form-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated from name"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Type</Label>
                <Select
                  options={FORM_TYPE_OPTIONS}
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as FormType)}
                />
              </div>
              <div>
                <Label htmlFor="form-desc">Description</Label>
                <Input
                  id="form-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Internal description"
                />
              </div>
            </div>

            {/* Fields builder */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-base font-semibold">Form Fields</Label>
                <Button variant="outline" size="sm" onClick={addField}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Field
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                  <FileText className="mx-auto mb-2 h-6 w-6" />
                  No fields yet. Click &quot;Add Field&quot; to start building your form.
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="grid gap-2 sm:grid-cols-4">
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(i, { label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") })}
                          placeholder="Field label"
                        />
                        <Select
                          options={FIELD_TYPE_OPTIONS}
                          value={field.type}
                          onChange={(e) =>
                            updateField(i, { type: e.target.value as FormFieldType })
                          }
                        />
                        <Input
                          value={field.placeholder ?? ""}
                          onChange={(e) => updateField(i, { placeholder: e.target.value })}
                          placeholder="Placeholder"
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-xs text-gray-600">
                            <input
                              type="checkbox"
                              checked={field.required ?? false}
                              onChange={(e) => updateField(i, { required: e.target.checked })}
                              className="h-3 w-3"
                            />
                            Required
                          </label>
                          <button
                            onClick={() => removeField(i)}
                            className="ml-auto rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-base font-semibold">Settings</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="submit-label">Submit Button Text</Label>
                  <Input
                    id="submit-label"
                    value={submitLabel}
                    onChange={(e) => setSubmitLabel(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-url">Webhook URL (optional)</Label>
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.zapier.com/..."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="success-msg">Success Message</Label>
                <Input
                  id="success-msg"
                  value={successMessage}
                  onChange={(e) => setSuccessMessage(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingId ? (
                "Save Changes"
              ) : (
                "Create Form"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
