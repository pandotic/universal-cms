import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getAllSettings,
  updateSettings,
} from "@pandotic/universal-cms/data/settings";

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const settings = await getAllSettings(supabase);
    return NextResponse.json({ data: settings });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { settings } = await request.json();
    await updateSettings(supabase, settings);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
