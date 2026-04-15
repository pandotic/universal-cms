import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Guard: check that no admin exists yet
    const { count: hubAdminCount } = await supabase
      .from("hub_users")
      .select("*", { count: "exact", head: true })
      .eq("hub_role", "super_admin");

    const { count: roleAdminCount } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role_type", "platform_admin")
      .eq("is_active", true);

    if ((hubAdminCount ?? 0) > 0 || (roleAdminCount ?? 0) > 0) {
      return NextResponse.json(
        { error: "An admin account already exists. Use the login page instead." },
        { status: 403 }
      );
    }

    // Create the Supabase auth user (skip email confirmation for bootstrap)
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const authUserId = authData.user.id;

    // Create hub_users record with super_admin role
    const { error: hubError } = await supabase.from("hub_users").insert({
      auth_user_id: authUserId,
      email,
      display_name: displayName || email.split("@")[0],
      hub_role: "super_admin",
    });

    if (hubError) {
      return NextResponse.json(
        { error: `Account created but hub user setup failed: ${hubError.message}` },
        { status: 500 }
      );
    }

    // Also bootstrap platform_admin in user_roles if the table exists
    try {
      await supabase.from("user_roles").insert({
        user_id: authUserId,
        role_type: "platform_admin",
        granted_by: authUserId,
        is_active: true,
      });
    } catch {
      // user_roles table may not exist — not critical
    }

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
