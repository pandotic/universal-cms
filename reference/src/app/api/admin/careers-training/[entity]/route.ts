import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin, apiError } from "@/lib/api/auth";

const ENTITY_TABLE_MAP: Record<string, string> = {
  providers: "ch_providers",
  programs: "ch_programs",
  roles: "ch_roles",
  resources: "ch_resources",
  tags: "ch_tags",
  "job-sources": "ch_job_sources",
};

// Name field varies by entity
const NAME_FIELD_MAP: Record<string, string> = {
  providers: "name",
  programs: "title",
  roles: "name",
  resources: "title",
  tags: "name",
  "job-sources": "source_name",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { entity } = await params;
    const table = ENTITY_TABLE_MAP[entity];
    if (!table) {
      return NextResponse.json({ error: `Unknown entity: ${entity}` }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    let query;
    if (entity === "programs") {
      query = supabase
        .from(table)
        .select("*, provider:ch_providers(id, slug, name)")
        .order("created_at", { ascending: false });
    } else {
      query = supabase
        .from(table)
        .select("*")
        .order("sort_order" in {} ? "sort_order" : "created_at", { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { entity } = await params;
    const table = ENTITY_TABLE_MAP[entity];
    if (!table) {
      return NextResponse.json({ error: `Unknown entity: ${entity}` }, { status: 400 });
    }

    const body = await request.json();

    // Auto-generate slug if not provided
    const nameField = NAME_FIELD_MAP[entity];
    if (!body.slug && body[nameField]) {
      body.slug = slugify(body[nameField]);
    }

    // Validate required fields
    if (!body.slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }
    if (!body[nameField]) {
      return NextResponse.json(
        { error: `${nameField} is required` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from(table).insert(body).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
