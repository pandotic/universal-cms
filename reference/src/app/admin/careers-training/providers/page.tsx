import { getSupabaseAdmin } from "@/lib/supabase-server";
import AdminCareersClient, {
  type ColumnConfig,
  type FormFieldConfig,
} from "../AdminCareersClient";

export const dynamic = "force-dynamic";

const columns: ColumnConfig[] = [
  { key: "slug", label: "Slug", type: "text" },
  { key: "name", label: "Name", type: "text" },
  { key: "organization_type", label: "Org Type", type: "text" },
  { key: "is_featured", label: "Featured", type: "boolean" },
  { key: "is_active", label: "Active", type: "boolean" },
  { key: "sort_order", label: "Sort", type: "number" },
];

const formFields: FormFieldConfig[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "slug", label: "Slug", type: "text", placeholder: "Auto-generated from name" },
  { key: "short_description", label: "Short Description", type: "textarea" },
  { key: "official_url", label: "Official URL", type: "url", required: true },
  { key: "official_youtube_channel_url", label: "YouTube Channel URL", type: "url" },
  { key: "logo_url", label: "Logo URL", type: "url" },
  {
    key: "organization_type",
    label: "Organization Type",
    type: "select",
    options: ["standards_body", "training_provider", "professional_association", "university", "platform", "other"],
  },
  { key: "headquarters_region", label: "HQ Region", type: "text" },
  { key: "provider_category", label: "Provider Category", type: "text" },
  { key: "is_featured", label: "Featured", type: "boolean" },
  { key: "is_active", label: "Active", type: "boolean" },
  { key: "sort_order", label: "Sort Order", type: "number" },
];

export default async function AdminProvidersPage() {
  let items: Record<string, unknown>[] = [];
  let error: string | null = null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error: dbError } = await supabase
      .from("ch_providers")
      .select("*")
      .order("sort_order", { ascending: true });

    if (dbError) throw new Error(dbError.message);
    items = (data ?? []) as Record<string, unknown>[];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load providers";
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <AdminCareersClient
        entityType="providers"
        entityLabel="Provider"
        items={items}
        columns={columns}
        formFields={formFields}
      />
    </div>
  );
}
