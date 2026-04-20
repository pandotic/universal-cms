import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  deletePromptkitEntry,
  togglePromptkitFavorite,
} from "@pandotic/universal-cms/data/promptkit-history";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RLS enforces ownership — deletePromptkitEntry will silently no-op
    // if the row is not owned by the current user.
    await deletePromptkitEntry(supabase, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (typeof body.is_favorite !== "boolean") {
      return NextResponse.json(
        { error: "is_favorite (boolean) required" },
        { status: 400 }
      );
    }

    const entry = await togglePromptkitFavorite(supabase, id, body.is_favorite);
    return NextResponse.json({ data: entry });
  } catch (e) {
    return apiError(e);
  }
}
