import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin, apiError } from "@pandotic/universal-cms/middleware";
import { getAllMedia } from "@pandotic/universal-cms/data/media";

export async function GET(request: NextRequest) {
  const authClient = await createClient();
  const authError = await requireAdmin(authClient, request);
  if (authError) return authError;

  try {
    const supabase = await createAdminClient();
    const media = await getAllMedia(supabase);
    return NextResponse.json({ data: media });
  } catch (e) {
    return apiError(e);
  }
}
