import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, apiError } from "@/lib/api/auth";
import { validateBody, createUserSchema } from "@/lib/security/validation";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select("*, user_roles(role)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { data: validated, error: validationError } = validateBody(
      createUserSchema,
      body
    );
    if (validationError) return validationError;

    const supabase = await getSupabaseAdmin();

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({ email: validated.email })
      .select()
      .single();

    if (profileError) throw profileError;

    // Assign role if provided
    if (validated.role) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: profile.id, role: validated.role });

      if (roleError) throw roleError;
    }

    return NextResponse.json({ data: profile }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
