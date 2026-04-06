import { getSupabaseAdmin } from "@/lib/supabase-server";
import AdminCareersClient, {
  type ColumnConfig,
  type FormFieldConfig,
} from "../AdminCareersClient";

export const dynamic = "force-dynamic";

const columns: ColumnConfig[] = [
  { key: "slug", label: "Slug", type: "text" },
  { key: "source_name", label: "Name", type: "text" },
  { key: "category", label: "Category", type: "text" },
  { key: "is_featured", label: "Featured", type: "boolean" },
  { key: "is_active", label: "Active", type: "boolean" },
  { key: "sort_order", label: "Sort", type: "number" },
];

const formFields: FormFieldConfig[] = [
  { key: "source_name", label: "Source Name", type: "text", required: true },
  { key: "slug", label: "Slug", type: "text", placeholder: "Auto-generated from name" },
  { key: "source_url", label: "Source URL", type: "url", required: true },
  { key: "description", label: "Description", type: "textarea" },
  {
    key: "category",
    label: "Category",
    type: "select",
    options: ["job_board", "company_careers", "aggregator", "niche", "government", "other"],
  },
  { key: "is_external", label: "External", type: "boolean" },
  { key: "is_featured", label: "Featured", type: "boolean" },
  { key: "is_active", label: "Active", type: "boolean" },
  { key: "sort_order", label: "Sort Order", type: "number" },
];

export default async function AdminJobSourcesPage() {
  let items: Record<string, unknown>[] = [];
  let error: string | null = null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error: dbError } = await supabase
      .from("ch_job_sources")
      .select("*")
      .order("sort_order", { ascending: true });

    if (dbError) throw new Error(dbError.message);
    items = (data ?? []) as Record<string, unknown>[];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load job sources";
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <AdminCareersClient
        entityType="job-sources"
        entityLabel="Job Source"
        items={items}
        columns={columns}
        formFields={formFields}
      />
    </div>
  );
}
