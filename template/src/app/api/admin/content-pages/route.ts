import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getAllContentPages,
  createContentPage,
} from "@pandotic/universal-cms/data/content";

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const pages = await getAllContentPages(supabase);
    return NextResponse.json({ data: pages });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const page = await createContentPage(supabase, body);
    return NextResponse.json({ data: page }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
