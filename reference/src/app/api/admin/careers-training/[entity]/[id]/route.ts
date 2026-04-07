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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { entity, id } = await params;
    const table = ENTITY_TABLE_MAP[entity];
    if (!table) {
      return NextResponse.json({ error: `Unknown entity: ${entity}` }, { status: 400 });
    }

    const body = await request.json();

    // Set updated_at
    body.updated_at = new Date().toISOString();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(table)
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { entity, id } = await params;
    const table = ENTITY_TABLE_MAP[entity];
    if (!table) {
      return NextResponse.json({ error: `Unknown entity: ${entity}` }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Tags get hard-deleted; everything else gets soft-deleted
    if (entity === "tags") {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ deleted: true });
    }

    // Soft delete: set is_active = false
    const { data, error } = await supabase
      .from(table)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    return apiError(e);
  }
}
