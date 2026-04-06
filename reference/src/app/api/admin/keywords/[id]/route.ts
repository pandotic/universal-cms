import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiError } from "@/lib/api/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// PUT /api/admin/keywords/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

    const {
      search_volume,
      difficulty,
      assigned_page_type,
      assigned_page_slug,
      notes,
    } = body;

    // Build update payload — only include defined fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if ("search_volume" in body) updates.search_volume = search_volume ?? null;
    if ("difficulty" in body) updates.difficulty = difficulty ?? null;
    if ("assigned_page_type" in body)
      updates.assigned_page_type = assigned_page_type ?? null;
    if ("assigned_page_slug" in body)
      updates.assigned_page_slug = assigned_page_slug ?? null;
    if ("notes" in body) updates.notes = notes ?? null;

    const sb = await getSupabaseAdmin();

    const { data, error } = await sb
      .from("keyword_registry")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Keyword not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ data });
  } catch (e) {
    return apiError(e);
  }
}

// DELETE /api/admin/keywords/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const sb = await getSupabaseAdmin();

    const { error } = await sb
      .from("keyword_registry")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Keyword not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
