import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getContentPageById,
  updateContentPage,
  deleteContentPage,
} from "@pandotic/universal-cms/data/content";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const page = await getContentPageById(supabase, id);
    if (!page) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ page });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load content page" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { page } = await request.json();
    const updated = await updateContentPage(supabase, id, page);
    return NextResponse.json({ page: updated });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update content page" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    await deleteContentPage(supabase, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete content page" },
      { status: 500 },
    );
  }
}
