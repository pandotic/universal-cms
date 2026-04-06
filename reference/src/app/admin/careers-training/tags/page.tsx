import { getSupabaseAdmin } from "@/lib/supabase-server";
import AdminCareersClient, {
  type ColumnConfig,
  type FormFieldConfig,
} from "../AdminCareersClient";

export const dynamic = "force-dynamic";

const columns: ColumnConfig[] = [
  { key: "slug", label: "Slug", type: "text" },
  { key: "name", label: "Name", type: "text" },
  { key: "is_featured", label: "Featured", type: "boolean" },
];

const formFields: FormFieldConfig[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "slug", label: "Slug", type: "text", placeholder: "Auto-generated from name" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "is_featured", label: "Featured", type: "boolean" },
];

export default async function AdminTagsPage() {
  let items: Record<string, unknown>[] = [];
  let error: string | null = null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error: dbError } = await supabase
      .from("ch_tags")
      .select("*")
      .order("name", { ascending: true });

    if (dbError) throw new Error(dbError.message);
    items = (data ?? []) as Record<string, unknown>[];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load tags";
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <AdminCareersClient
        entityType="tags"
        entityLabel="Tag"
        items={items}
        columns={columns}
        formFields={formFields}
      />
    </div>
  );
}
