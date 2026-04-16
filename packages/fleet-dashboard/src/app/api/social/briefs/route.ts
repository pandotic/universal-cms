import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdmin, getCurrentUserId } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  listBriefs,
  createBrief,
} from "@pandotic/universal-cms/data/hub-social";
import { logHubActivity } from "@pandotic/universal-cms/data/hub-activity";
import { getHubUser } from "@pandotic/universal-cms/data/hub-users";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createAdminClient();
    const searchParams = request.nextUrl.searchParams;

    const propertyId = searchParams.get("propertyId") ?? undefined;
    const name = searchParams.get("name") ?? undefined;

    const briefs = await listBriefs(supabase, { propertyId, name });
    return NextResponse.json({ data: briefs });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);

    const authError = await requirePlatformAdmin(authClient, userId ?? undefined);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const body = await request.json();

    const brief = await createBrief(supabase, {
      property_id: body.property_id,
      name: body.name,
      platform: body.platform ?? "",
      tone: body.tone ?? [],
      audience: body.audience ?? "",
      key_messages: body.key_messages ?? [],
      dos: body.dos ?? [],
      donts: body.donts ?? [],
      example_posts: body.example_posts ?? null,
      metadata: body.metadata ?? {},
      created_by: userId!,
    });

    if (userId) {
      const hubUser = await getHubUser(supabase, userId);
      await logHubActivity(supabase, {
        user_id: hubUser?.id,
        property_id: body.property_id,
        action: "create",
        entity_type: "brand_voice_brief",
        entity_id: brief.id,
        description: `Created brand voice brief "${brief.name}"`,
      });
    }

    return NextResponse.json({ data: brief }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
