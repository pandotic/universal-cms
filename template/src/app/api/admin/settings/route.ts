import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin, apiError } from "@pandotic/universal-cms/middleware";
import {
  getAllSettings,
  updateSettings,
} from "@pandotic/universal-cms/data/settings";

export async function GET(request: NextRequest) {
  const authClient = await createClient();
  const authError = await requireAdmin(authClient, request);
  if (authError) return authError;

  try {
    const supabase = await createAdminClient();
    const settings = await getAllSettings(supabase);
    return NextResponse.json({ data: settings });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(request: NextRequest) {
  const authClient = await createClient();
  const authError = await requireAdmin(authClient, request);
  if (authError) return authError;

  try {
    const supabase = await createAdminClient();
    const { settings } = await request.json();
    await updateSettings(supabase, settings);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
