import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  listPromptkitHistory,
  savePromptkitEntry,
  clearPromptkitHistory,
} from "@pandotic/universal-cms/data/promptkit-history";
import type { LLMProvider } from "@pandotic/universal-cms/types/promptkit";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const provider = url.searchParams.get("provider") as LLMProvider | null;
    const favorite = url.searchParams.get("favorite") === "true";
    const propertyId = url.searchParams.get("property_id");
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const offset = Number(url.searchParams.get("offset") ?? 0);

    const result = await listPromptkitHistory(supabase, user.id, {
      provider: provider ?? undefined,
      favorite: favorite || undefined,
      propertyId: propertyId ?? undefined,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (
      !body.provider ||
      !body.model_id ||
      !body.raw_prompt ||
      !body.optimized_prompt
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const entry = await savePromptkitEntry(supabase, {
      user_id: user.id,
      provider: body.provider,
      model_id: body.model_id,
      model_label: body.model_label,
      raw_prompt: body.raw_prompt,
      optimized_prompt: body.optimized_prompt,
      notes: Array.isArray(body.notes) ? body.notes : [],
      tone: body.tone ?? "direct",
      output_mode: body.output_mode ?? "single",
      label: body.label,
      property_id: body.property_id ?? null,
    });

    return NextResponse.json({ data: entry });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await clearPromptkitHistory(supabase, user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
