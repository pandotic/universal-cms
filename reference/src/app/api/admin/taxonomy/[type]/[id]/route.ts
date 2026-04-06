import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, apiError } from "@/lib/api/auth";

const TYPE_TABLE_MAP: Record<string, string> = {
  entities: "entities",
  frameworks: "frameworks",
  glossary: "glossary_terms",
  categories: "categories",
  "category-content": "category_content",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { type, id } = await params;
    const table = TYPE_TABLE_MAP[type];
    if (!table) {
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { type, id } = await params;
    const table = TYPE_TABLE_MAP[type];
    if (!table) {
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    const body = await request.json();

    // Remove id from body to prevent conflicts
    delete body.id;

    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from(table)
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { type, id } = await params;
    const table = TYPE_TABLE_MAP[type];
    if (!table) {
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    const supabase = await getSupabaseAdmin();

    // For categories, delete related category_content first (cascade via FK)
    if (type === "categories") {
      const { error: contentError } = await supabase
        .from("category_content")
        .delete()
        .eq("category_id", id);

      if (contentError) {
        return NextResponse.json({ error: contentError.message }, { status: 500 });
      }
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
