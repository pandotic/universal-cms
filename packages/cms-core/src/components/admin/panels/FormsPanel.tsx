"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type Form,
  type FormStatus,
  type FormSubmission,
  deleteForm,
  getAllForms,
  getSubmissions,
  updateForm,
} from "../../../data/forms.js";
import {
  GhostButton,
  PanelEmpty,
  PanelError,
  PanelHeading,
  PanelSpinner,
  StatusBadge,
} from "./_shared.js";

const STATUS_TONES: Record<FormStatus, "success" | "warning" | "neutral"> = {
  active: "success",
  draft: "warning",
  archived: "neutral",
};

export interface FormsPanelProps {
  supabase: SupabaseClient;
}

export function FormsPanel({ supabase }: FormsPanelProps) {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Form | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setForms(await getAllForms(supabase));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load forms");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function toggleStatus(f: Form) {
    const next: FormStatus = f.status === "active" ? "draft" : "active";
    try {
      await updateForm(supabase, f.id, { status: next });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleDelete(f: Form) {
    if (
      !confirm(
        `Delete form "${f.name}" and all ${f.submission_count} submission(s)?`,
      )
    )
      return;
    try {
      await deleteForm(supabase, f.id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  if (viewing) {
    return (
      <SubmissionsView
        supabase={supabase}
        form={viewing}
        onBack={() => setViewing(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PanelHeading
        title="Forms"
        description={`${forms.length} forms. Click a form to view submissions.`}
      />
      <PanelError message={error} />

      {loading ? (
        <PanelSpinner />
      ) : forms.length === 0 ? (
        <PanelEmpty>
          No forms yet. Forms are created via the universal-cms forms helpers
          or seeded via SQL.
        </PanelEmpty>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary text-foreground-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Submissions</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {forms.map((f) => (
                <tr
                  key={f.id}
                  className="transition-colors hover:bg-surface-secondary/40"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewing(f)}
                      className="text-left font-medium text-foreground hover:underline"
                    >
                      {f.name}
                    </button>
                    <p className="mt-0.5 text-xs text-foreground-tertiary">
                      {f.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {f.form_type}
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {f.submission_count}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(f)}>
                      <StatusBadge
                        status={f.status}
                        tone={STATUS_TONES[f.status]}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(f)}
                      className="text-xs text-foreground-tertiary hover:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SubmissionsView({
  supabase,
  form,
  onBack,
}: {
  supabase: SupabaseClient;
  form: Form;
  onBack: () => void;
}) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getSubmissions(supabase, form.id)
      .then(({ submissions: rows }) => {
        if (!cancelled) setSubmissions(rows);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, form.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GhostButton type="button" onClick={onBack}>
          ← Back
        </GhostButton>
        <PanelHeading
          title={form.name}
          description={`Submissions for ${form.slug}.`}
        />
      </div>
      <PanelError message={error} />

      {loading ? (
        <PanelSpinner />
      ) : submissions.length === 0 ? (
        <PanelEmpty>No submissions yet.</PanelEmpty>
      ) : (
        <ul className="space-y-2">
          {submissions.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-border bg-surface p-3"
            >
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-xs text-foreground-tertiary">
                  {new Date(s.submitted_at).toLocaleString()}
                </span>
                <StatusBadge status={s.status} />
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-foreground">
                {JSON.stringify(s.data, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
