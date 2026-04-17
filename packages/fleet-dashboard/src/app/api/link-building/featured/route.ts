import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentUserId, requirePlatformAdmin } from "@/lib/middleware/admin-rbac";
import { apiError } from "@pandotic/universal-cms/middleware";
import {
  listFeaturedOutboundPitches,
  createFeaturedOutboundPitch,
  listFeaturedInboundSubmissions,
  createFeaturedInboundSubmission,
} from "@pandotic/universal-cms/data/hub-link-building";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const userId = await getCurrentUserId(authClient);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createAdminClient();
    const params = request.nextUrl.searchParams;
    const direction = params.get("direction") ?? "outbound";
    const propertyId = params.get("propertyId") ?? undefined;

    if (direction === "inbound") {
      const data = await listFeaturedInboundSubmissions(supabase, propertyId);
      return NextResponse.json({ data });
    }

    const data = await listFeaturedOutboundPitches(supabase, propertyId);
    return NextResponse.json({ data });
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

    if (body.direction === "inbound") {
      const submission = await createFeaturedInboundSubmission(supabase, {
        property_id: body.property_id ?? null,
        contributor_email: body.contributor_email ?? null,
        pitch_summary: body.pitch_summary ?? null,
        status: body.status ?? null,
        received_at: body.received_at ?? null,
      });
      return NextResponse.json({ data: submission }, { status: 201 });
    }

    const pitch = await createFeaturedOutboundPitch(supabase, {
      property_id: body.property_id ?? null,
      question: body.question ?? null,
      answer: body.answer ?? null,
      publication: body.publication ?? null,
      status: body.status ?? null,
      pitched_at: body.pitched_at ?? null,
      published_url: body.published_url ?? null,
    });
    return NextResponse.json({ data: pitch }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
