"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

export interface ColumnConfig {
  key: string;
  label: string;
  type: "text" | "boolean" | "number" | "select";
  options?: string[];
}

export interface FormFieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "boolean" | "number" | "select" | "url";
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

interface AdminCareersClientProps {
  entityType: string;
  entityLabel: string;
  items: Record<string, unknown>[];
  columns: ColumnConfig[];
  formFields: FormFieldConfig[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCareersClient({
  entityType,
  entityLabel,
  items,
  columns,
  formFields,
}: AdminCareersClientProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<string>("sort_order");
  const [sortAsc, setSortAsc] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const apiBase = `/api/admin/careers-training/${entityType}`;

  const sortedItems = [...items].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === "boolean" && typeof bVal === "boolean") {
      return sortAsc ? (aVal === bVal ? 0 : aVal ? -1 : 1) : (aVal === bVal ? 0 : aVal ? 1 : -1);
    }
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    const cmp = String(aVal).localeCompare(String(bVal));
    return sortAsc ? cmp : -cmp;
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const openAddForm = () => {
    const initial: Record<string, unknown> = {};
    formFields.forEach((f) => {
      if (f.type === "boolean") initial[f.key] = false;
      else if (f.type === "number") initial[f.key] = 0;
      else initial[f.key] = "";
    });
    setFormData(initial);
    setShowAddForm(true);
    setEditingId(null);
    setError(null);
  };

  const openEditForm = (item: Record<string, unknown>) => {
    const data: Record<string, unknown> = {};
    formFields.forEach((f) => {
      data[f.key] = item[f.key] ?? (f.type === "boolean" ? false : f.type === "number" ? 0 : "");
    });
    setFormData(data);
    setEditingId(item.id as string);
    setShowAddForm(false);
    setError(null);
  };

  const setField = useCallback((key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async (isNew: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...formData };

      // Auto-generate slug if empty
      if (!payload.slug && (payload.name || payload.title || payload.source_name)) {
        payload.slug = slugify(
          (payload.name as string) || (payload.title as string) || (payload.source_name as string)
        );
      }

      const url = isNew ? apiBase : `${apiBase}/${editingId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to save (${res.status})`);
      }

      setShowAddForm(false);
      setEditingId(null);
      setFormData({});
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete (${res.status})`);
      }
      setDeleteConfirmId(null);
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: Record<string, unknown>, key: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: !item[key] }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Toggle failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Toggle failed");
    } finally {
      setSaving(false);
    }
  };

  const renderCellValue = (item: Record<string, unknown>, col: ColumnConfig) => {
    const val = item[col.key];
    if (col.type === "boolean") {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle(item, col.key);
          }}
          className={`inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            val ? "bg-green-500" : "bg-gray-300"
          }`}
          disabled={saving}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
              val ? "translate-x-4.5" : "translate-x-0.5"
            }`}
          />
        </button>
      );
    }
    if (val == null) return <span className="text-gray-400">-</span>;
    if (col.type === "number") return <span>{String(val)}</span>;
    return <span>{String(val)}</span>;
  };

  const renderFormField = (field: FormFieldConfig) => {
    const val = formData[field.key];
    const baseInputClasses =
      "block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

    if (field.type === "boolean") {
      return (
        <label key={field.key} className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            checked={!!val}
            onChange={(e) => setField(field.key, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{field.label}</span>
        </label>
      );
    }

    if (field.type === "select" && field.options) {
      return (
        <div key={field.key}>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
          </label>
          <select
            value={String(val ?? "")}
            onChange={(e) => setField(field.key, e.target.value)}
            className={baseInputClasses}
          >
            <option value="">Select...</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.key}>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
          </label>
          <textarea
            value={String(val ?? "")}
            onChange={(e) => setField(field.key, e.target.value)}
            rows={3}
            className={baseInputClasses}
            placeholder={field.placeholder}
          />
        </div>
      );
    }

    if (field.type === "number") {
      return (
        <div key={field.key}>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
          </label>
          <input
            type="number"
            value={val != null ? Number(val) : 0}
            onChange={(e) => setField(field.key, Number(e.target.value))}
            className={baseInputClasses}
          />
        </div>
      );
    }

    return (
      <div key={field.key}>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </label>
        <input
          type={field.type === "url" ? "url" : "text"}
          value={String(val ?? "")}
          onChange={(e) => setField(field.key, e.target.value)}
          className={baseInputClasses}
          placeholder={field.placeholder}
        />
      </div>
    );
  };

  const renderForm = (isNew: boolean) => (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          {isNew ? `Add New ${entityLabel}` : `Edit ${entityLabel}`}
        </h3>
        <button
          onClick={() => {
            setShowAddForm(false);
            setEditingId(null);
            setError(null);
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {formFields.map(renderFormField)}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => handleSave(isNew)}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : isNew ? "Create" : "Update"}
        </button>
        {!isNew && (
          <>
            {deleteConfirmId === editingId ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">Are you sure?</span>
                <button
                  onClick={() => handleDelete(editingId!)}
                  disabled={saving}
                  className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirmId(editingId)}
                className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {items.length} {items.length === 1 ? "item" : "items"} total
        </p>
        <button
          onClick={openAddForm}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + Add New
        </button>
      </div>

      {showAddForm && renderForm(true)}

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="cursor-pointer px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-gray-700"
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="ml-1">{sortAsc ? "\u2191" : "\u2193"}</span>
                    )}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedItems.map((item) => (
                <tr key={item.id as string} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="whitespace-nowrap px-4 py-2 text-sm text-gray-700"
                    >
                      {renderCellValue(item, col)}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-2 text-sm">
                    <button
                      onClick={() => openEditForm(item)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {sortedItems.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No items found. Click &quot;Add New&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingId && (
        <div className="mt-4">{renderForm(false)}</div>
      )}
    </div>
  );
}
