import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import {
  listMarketingServices,
  upsertMarketingService,
} from "@pandotic/universal-cms/data/hub-marketing";
import type { MarketingServiceFilters } from "@pandotic/universal-cms/types/hub-marketing";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin", "member", "viewer",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const filters: MarketingServiceFilters = {};
    if (searchParams.get("property_id")) filters.propertyId = searchParams.get("property_id")!;
    if (searchParams.get("service_type")) filters.serviceType = searchParams.get("service_type") as any;
    if (searchParams.get("status")) filters.status = searchParams.get("status") as any;

    const services = await listMarketingServices(supabase, filters);
    return NextResponse.json({ data: services });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin", "group_admin",
    ]);
    if (authError) return authError;

    const supabase = await createAdminClient();
    const body = await request.json();
    const service = await upsertMarketingService(supabase, body);
    return NextResponse.json({ data: service }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
