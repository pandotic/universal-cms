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
    key: "program_type",
    label: "Type",
    type: "select",
    options: [
      "certification",
      "certificate_program",
      "course",
      "webinar",
      "learning_library",
      "knowledge_hub",
      "exam_prep",
      "jobs_resource",
    ],
  },
  {
    key: "level",
    label: "Level",
    type: "select",
    options: ["beginner", "intermediate", "advanced", "mixed"],
  },
  { key: "is_free", label: "Free", type: "boolean" },
  { key: "is_featured", label: "Featured", type: "boolean" },
  { key: "is_active", label: "Active", type: "boolean" },
  { key: "provider_name", label: "Provider", type: "text" },
];

const formFields: FormFieldConfig[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "slug", label: "Slug", type: "text", placeholder: "Auto-generated from title" },
  { key: "provider_id", label: "Provider ID", type: "text", required: true, placeholder: "UUID of provider" },
  {
    key: "program_type",
    label: "Program Type",
    type: "select",
    required: true,
    options: [
      "certification",
      "certificate_program",
      "course",
      "webinar",
      "learning_library",
      "knowledge_hub",
      "exam_prep",
      "jobs_resource",
    ],
  },
  { key: "short_summary", label: "Short Summary", type: "textarea" },
  { key: "official_url", label: "Official URL", type: "url", required: true },
  {
    key: "level",
    label: "Level",
    type: "select",
    options: ["beginner", "intermediate", "advanced", "mixed"],
  },
  {
    key: "format",
    label: "Format",
    type: "select",
    options: ["self_paced", "live_online", "partner_led", "hybrid", "resource_library", "webinar"],
  },
  { key: "is_free", label: "Free", type: "boolean" },
  { key: "price_text", label: "Price Text", type: "text" },
  { key: "duration_text", label: "Duration", type: "text" },
  { key: "estimated_hours", label: "Estimated Hours", type: "number" },
  { key: "credential_name", label: "Credential Name", type: "text" },
  { key: "is_featured", label: "Featured", type: "boolean" },
  { key: "is_active", label: "Active", type: "boolean" },
  { key: "featured_rank", label: "Featured Rank", type: "number" },
];

export default async function AdminProgramsPage() {
  let items: Record<string, unknown>[] = [];
  let error: string | null = null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error: dbError } = await supabase
      .from("ch_programs")
      .select("*, provider:ch_providers(id, slug, name)")
      .order("created_at", { ascending: false });

    if (dbError) throw new Error(dbError.message);

    // Flatten provider info for the table display
    items = ((data ?? []) as Record<string, unknown>[]).map((item) => {
      const provider = item.provider as Record<string, unknown> | null;
      return {
        ...item,
        provider_name: provider?.name ?? "-",
      };
    });
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load programs";
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <AdminCareersClient
        entityType="programs"
        entityLabel="Program"
        items={items}
        columns={columns}
        formFields={formFields}
      />
    </div>
  );
}
