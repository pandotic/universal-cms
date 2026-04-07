import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // AI chat requires ANTHROPIC_API_KEY env var
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Placeholder - integrate with @pandotic/universal-cms/ai for full chat
    return NextResponse.json({
      data: { message: "AI chat is ready to be configured." },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
