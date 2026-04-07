import type { SupabaseClient } from "@supabase/supabase-js";

export type FormType = "contact" | "lead" | "newsletter" | "cta" | "custom";
export type FormFieldType =
  | "text"
  | "email"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "number"
  | "tel"
  | "url"
  | "hidden";
export type FormStatus = "draft" | "active" | "archived";
export type SubmissionStatus = "new" | "read" | "archived" | "spam";

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface FormSettings {
  submitLabel?: string;
  successMessage?: string;
  redirectUrl?: string;
  webhookUrl?: string;
  notifyEmails?: string[];
  honeypotField?: string;
}

export interface Form {
  id: string;
  name: string;
  slug: string;
  form_type: FormType;
  description: string | null;
  fields: FormField[];
  settings: FormSettings;
  status: FormStatus;
  submission_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  data: Record<string, unknown>;
  status: SubmissionStatus;
  source_url: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  submitted_at: string;
}

// ── Forms CRUD ──────────────────────────────────────────────────────────────

export async function getAllForms(client: SupabaseClient): Promise<Form[]> {
  const { data, error } = await client
    .from("forms")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getFormById(
  client: SupabaseClient,
  id: string
): Promise<Form | null> {
  const { data, error } = await client
    .from("forms")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getFormBySlug(
  client: SupabaseClient,
  slug: string
): Promise<Form | null> {
  const { data, error } = await client
    .from("forms")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createForm(
  client: SupabaseClient,
  form: Partial<Form>
): Promise<Form> {
  const { data, error } = await client
    .from("forms")
    .insert(form)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateForm(
  client: SupabaseClient,
  id: string,
  updates: Partial<Form>
): Promise<Form> {
  const { data, error } = await client
    .from("forms")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteForm(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("forms").delete().eq("id", id);
  if (error) throw error;
}

// ── Submissions ─────────────────────────────────────────────────────────────

export async function createSubmission(
  client: SupabaseClient,
  submission: {
    form_id: string;
    data: Record<string, unknown>;
    source_url?: string;
    ip_hash?: string;
    user_agent?: string;
  }
): Promise<FormSubmission> {
  const { data, error } = await client
    .from("form_submissions")
    .insert(submission)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSubmissions(
  client: SupabaseClient,
  formId: string,
  options?: { status?: SubmissionStatus; limit?: number; offset?: number }
): Promise<{ submissions: FormSubmission[]; total: number }> {
  let query = client
    .from("form_submissions")
    .select("*", { count: "exact" })
    .eq("form_id", formId)
    .order("submitted_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { submissions: data ?? [], total: count ?? 0 };
}

export async function updateSubmissionStatus(
  client: SupabaseClient,
  id: string,
  status: SubmissionStatus
): Promise<void> {
  const { error } = await client
    .from("form_submissions")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}
