import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAllContentPages,
  createContentPage,
} from "@pandotic/universal-cms/data/content";

export async function GET() {
  try {
    const supabase = await createClient();
    const pages = await getAllContentPages(supabase);
    return NextResponse.json({ pages });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list content pages" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { page } = await request.json();
    const created = await createContentPage(supabase, page);
    return NextResponse.json({ page: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create content page" },
      { status: 500 },
    );
  }
}
