import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiError } from "@/lib/api/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// GET /api/admin/keywords?page=1&limit=50&search=...
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10))
    );
    const offset = (page - 1) * limit;
    const search = searchParams.get("search") ?? "";

    const sb = await getSupabaseAdmin();
    let query = sb
      .from("keyword_registry")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike("keyword", `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ data, total: count ?? 0, page, limit });
  } catch (e) {
    return apiError(e);
  }
}

// POST /api/admin/keywords
export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const {
      keyword,
      search_volume,
      difficulty,
      assigned_page_type,
      assigned_page_slug,
      notes,
    } = body;

    if (!keyword || typeof keyword !== "string" || keyword.trim() === "") {
      return NextResponse.json(
        { error: "keyword is required" },
        { status: 400 }
      );
    }

    const sb = await getSupabaseAdmin();

    // Check for conflicts: same keyword already assigned to a different page
    if (assigned_page_type && assigned_page_slug) {
      const { data: conflict } = await sb
        .from("keyword_registry")
        .select("id, assigned_page_type, assigned_page_slug")
        .eq("keyword", keyword.trim())
        .neq("assigned_page_type", assigned_page_type)
        .single();

      if (conflict) {
        return NextResponse.json(
          {
            error: `Keyword "${keyword}" is already assigned to a ${conflict.assigned_page_type} page (slug: ${conflict.assigned_page_slug}). Each keyword should target one page.`,
            conflict,
          },
          { status: 409 }
        );
      }
    }

    const { data, error } = await sb
      .from("keyword_registry")
      .insert({
        keyword: keyword.trim(),
        search_volume: search_volume ?? null,
        difficulty: difficulty ?? null,
        assigned_page_type: assigned_page_type ?? null,
        assigned_page_slug: assigned_page_slug ?? null,
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) {
      // Unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: `Keyword "${keyword}" already exists in the registry.` },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
