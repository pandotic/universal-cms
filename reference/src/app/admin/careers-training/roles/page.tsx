import { getSupabaseAdmin } from "@/lib/supabase-server";
import AdminCareersClient, {
  type ColumnConfig,
  type FormFieldConfig,
} from "../AdminCareersClient";

export const dynamic = "force-dynamic";

const columns: ColumnConfig[] = [
  { key: "slug", label: "Slug", type: "text" },
  { key: "name", label: "Name", type: "text" },
  { key: "progression_stage", label: "Stage", type: "text" },
  { key: "is_featured", label: "Featured", type: "boolean" },
  { key: "is_active", label: "Active", type: "boolean" },
  { key: "sort_order", label: "Sort", type: "number" },
];

const formFields: FormFieldConfig[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "slug", label: "Slug", type: "text", placeholder: "Auto-generated from name" },
  { key: "short_description", label: "Short Description", type: "textarea" },
  { key: "full_description", label: "Full Description", type: "textarea" },
  { key: "department_context", label: "Department Context", type: "text" },
  {
    key: "progression_stage",
    label: "Progression Stage",
    type: "select",
    options: ["entry", "mid", "senior", "executive"],
  },
  { key: "beginner_path_summary", label: "Beginner Path Summary", type: "textarea" },
  { key: "intermediate_path_summary", label: "Intermediate Path Summary", type: "textarea" },
  { key: "advanced_path_summary", label: "Advanced Path Summary", type: "textarea" },
  { key: "is_featured", label: "Featured", type: "boolean" },
  { key: "is_active", label: "Active", type: "boolean" },
  { key: "sort_order", label: "Sort Order", type: "number" },
];

export default async function AdminRolesPage() {
  let items: Record<string, unknown>[] = [];
  let error: string | null = null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error: dbError } = await supabase
      .from("ch_roles")
      .select("*")
      .order("sort_order", { ascending: true });

    if (dbError) throw new Error(dbError.message);
    items = (data ?? []) as Record<string, unknown>[];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load roles";
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <AdminCareersClient
        entityType="roles"
        entityLabel="Role"
        items={items}
        columns={columns}
        formFields={formFields}
      />
    </div>
  );
}
