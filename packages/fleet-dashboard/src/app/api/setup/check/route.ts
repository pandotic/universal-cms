import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // Check if any super_admin exists in hub_users
    const { count: hubAdminCount } = await supabase
      .from("hub_users")
      .select("*", { count: "exact", head: true })
      .eq("hub_role", "super_admin");

    // Check if any platform_admin exists in user_roles
    const { count: roleAdminCount } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role_type", "platform_admin")
      .eq("is_active", true);

    const needsSetup = (hubAdminCount ?? 0) === 0 && (roleAdminCount ?? 0) === 0;

    return NextResponse.json({ needsSetup });
  } catch {
    // If tables don't exist yet, setup is needed
    return NextResponse.json({ needsSetup: true });
  }
}
