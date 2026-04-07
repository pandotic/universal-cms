import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAllMedia } from "@pandotic/universal-cms/data/media";

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const media = await getAllMedia(supabase);
    return NextResponse.json({ data: media });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
