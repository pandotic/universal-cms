import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin, apiError } from "@pandotic/universal-cms/middleware";
import {
  getAllContentPages,
  createContentPage,
} from "@pandotic/universal-cms/data/content";

export async function GET(request: NextRequest) {
  const authClient = await createClient();
  const authError = await requireAdmin(authClient, request);
  if (authError) return authError;

  try {
    const supabase = await createAdminClient();
    const pages = await getAllContentPages(supabase);
    return NextResponse.json({ data: pages });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  const authClient = await createClient();
  const authError = await requireAdmin(authClient, request);
  if (authError) return authError;

  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const page = await createContentPage(supabase, body);
    return NextResponse.json({ data: page }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
