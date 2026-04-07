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

const NAME_FIELD_MAP: Record<string, string> = {
  entities: "name",
  frameworks: "name",
  glossary: "term",
  categories: "name",
  "category-content": "category_id",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { type } = await params;
    const table = TYPE_TABLE_MAP[type];
    if (!table) {
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    const supabase = await getSupabaseAdmin();

    let query = supabase.from(table).select("*");

    if (type === "entities") {
      query = query.order("sort_order", { ascending: true });
    } else if (type === "categories") {
      query = query.order("sort_order", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { type } = await params;
    const table = TYPE_TABLE_MAP[type];
    if (!table) {
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    const body = await request.json();

    // Auto-generate slug from name if not provided
    const nameField = NAME_FIELD_MAP[type];
    if (!body.slug && body[nameField]) {
      body.slug = slugify(body[nameField]);
    }

    if (!body.slug && type !== "category-content") {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase.from(table).insert(body).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
