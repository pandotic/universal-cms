import { getSupabaseAdmin } from "@/lib/supabase-server";
import AdminCareersClient, {
  type ColumnConfig,
  type FormFieldConfig,
} from "../AdminCareersClient";

export const dynamic = "force-dynamic";

const columns: ColumnConfig[] = [
  { key: "slug", label: "Slug", type: "text" },
  { key: "title", label: "Title", type: "text" },
  {
    key: "resource_type",
    label: "Type",
    type: "select",
    options: [
      "youtube_video",
      "youtube_playlist",
      "webinar",
      "downloadable_resource",
      "standards_hub",
      "official_page",
      "channel",
    ],
  },
  { key: "is_featured", label: "Featured", type: "boolean" },
  { key: "is_active", label: "Active", type: "boolean" },
  { key: "sort_order", label: "Sort", type: "number" },
];

const formFields: FormFieldConfig[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "slug", label: "Slug", type: "text", placeholder: "Auto-generated from title" },
  { key: "provider_id", label: "Provider ID", type: "text", placeholder: "UUID of provider (optional)" },
  {
    key: "resource_type",
    label: "Resource Type",
    type: "select",
    required: true,
    options: [
      "youtube_video",
      "youtube_playlist",
      "webinar",
      "downloadable_resource",
      "standards_hub",
      "official_page",
      "channel",
    ],
  },
  { key: "official_url", label: "Official URL", type: "url", required: true },
  { key: "embed_url", label: "Embed URL", type: "url" },
  { key: "short_summary", label: "Short Summary", type: "textarea" },
  { key: "thumbnail_url", label: "Thumbnail URL", type: "url" },
  { key: "is_featured", label: "Featured", type: "boolean" },
  { key: "is_active", label: "Active", type: "boolean" },
  { key: "sort_order", label: "Sort Order", type: "number" },
];

export default async function AdminResourcesPage() {
  let items: Record<string, unknown>[] = [];
  let error: string | null = null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error: dbError } = await supabase
      .from("ch_resources")
      .select("*")
      .order("sort_order", { ascending: true });

    if (dbError) throw new Error(dbError.message);
    items = (data ?? []) as Record<string, unknown>[];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load resources";
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <AdminCareersClient
        entityType="resources"
        entityLabel="Resource"
        items={items}
        columns={columns}
        formFields={formFields}
      />
    </div>
  );
}
