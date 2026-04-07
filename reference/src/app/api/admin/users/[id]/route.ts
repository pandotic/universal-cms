import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const { roles } = body;

    if (!Array.isArray(roles)) {
      return NextResponse.json(
        { error: "roles must be an array of strings" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseAdmin();

    // Delete existing roles
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", id);

    if (deleteError) throw deleteError;

    // Insert new roles
    if (roles.length > 0) {
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert(roles.map((role: string) => ({ user_id: id, role })));

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const supabase = await getSupabaseAdmin();

    // Delete roles first (foreign key)
    await supabase.from("user_roles").delete().eq("user_id", id);

    // Delete profile
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
