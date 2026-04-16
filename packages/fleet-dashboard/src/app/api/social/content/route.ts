import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdmin, getCurrentUserId } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  listSocialContent,
  createSocialContent,
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
    const briefId = searchParams.get("briefId") ?? undefined;
    const platform = searchParams.get("platform") as any ?? undefined;
    const status = searchParams.get("status") as any ?? undefined;
    const contentType = searchParams.get("contentType") as any ?? undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined;

    const content = await listSocialContent(supabase, {
      propertyId,
      briefId,
      platform,
      status,
      contentType,
      limit,
      offset,
    });
    return NextResponse.json({ data: content });
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

    const content = await createSocialContent(supabase, {
      property_id: body.property_id,
      brief_id: body.brief_id ?? null,
      platform: body.platform,
      content_type: body.content_type,
      title: body.title ?? null,
      body: body.body,
      media_urls: body.media_urls ?? [],
      hashtags: body.hashtags ?? [],
      status: body.status ?? "draft",
      scheduled_for: body.scheduled_for ?? null,
      published_at: null,
      metadata: body.metadata ?? {},
      created_by: userId!,
    });

    if (userId) {
      const hubUser = await getHubUser(supabase, userId);
      await logHubActivity(supabase, {
        user_id: hubUser?.id,
        property_id: body.property_id,
        action: "create",
        entity_type: "social_content",
        entity_id: content.id,
        description: `Created social content "${body.title ?? body.platform + " post"}"`,
      });
    }

    return NextResponse.json({ data: content }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
