import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // Check if any super_admin exists in hub_users
    const { count: hubAdminCount, error: hubError } = await supabase
      .from("hub_users")
      .select("*", { count: "exact", head: true })
      .eq("hub_role", "super_admin");

    // If hub_users table doesn't exist, setup is needed
    if (hubError) {
      return NextResponse.json({ needsSetup: true });
    }

    if ((hubAdminCount ?? 0) > 0) {
      return NextResponse.json({ needsSetup: false });
    }

    // Optionally check user_roles table (may not exist)
    const { count: roleAdminCount } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role_type", "platform_admin")
      .eq("is_active", true);

    if ((roleAdminCount ?? 0) > 0) {
      return NextResponse.json({ needsSetup: false });
    }

    return NextResponse.json({ needsSetup: true });
  } catch {
    // If something unexpected fails, assume setup is needed
    return NextResponse.json({ needsSetup: true });
  }
}
