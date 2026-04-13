import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import { listSkills, createSkill } from "@pandotic/skill-library/data/hub-skills";
import type { SkillFilters } from "@pandotic/skill-library/types";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin", "member", "viewer",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const filters: SkillFilters = {};
    if (searchParams.get("scope")) filters.scope = searchParams.get("scope") as any;
    if (searchParams.get("category")) filters.category = searchParams.get("category") as any;
    if (searchParams.get("platform")) filters.platform = searchParams.get("platform") as any;
    if (searchParams.get("status")) filters.status = searchParams.get("status") as any;
    if (searchParams.get("search")) filters.search = searchParams.get("search")!;

    const skills = await listSkills(supabase, filters);
    return NextResponse.json({ data: skills });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, ["super_admin"]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const body = await request.json();
    const skill = await createSkill(supabase, body);
    return NextResponse.json({ data: skill }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
