import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, apiError } from "@pandotic/universal-cms/middleware";

export async function POST(request: NextRequest) {
  const authClient = await createClient();
  const authError = await requireAdmin(authClient, request);
  if (authError) return authError;

  try {
    const { messages } = await request.json();

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
    return apiError(e);
  }
}
