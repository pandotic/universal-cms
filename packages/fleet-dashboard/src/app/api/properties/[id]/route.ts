import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubRole, apiError } from "@pandotic/universal-cms/middleware";
import {
  getPropertyById,
  updateProperty,
  deleteProperty,
} from "@pandotic/universal-cms/data/hub";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin",
      "group_admin",
      "member",
      "viewer",
    ]);
    if (authError) return authError;

    const { id } = await params;
    const supabase = await createAdminClient();
    const property = await getPropertyById(supabase, id);

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: property });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin",
    ]);
    if (authError) return authError;

    const { id } = await params;
    const supabase = await createAdminClient();
    const body = await request.json();

    const property = await updateProperty(supabase, id, body);
    return NextResponse.json({ data: property });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin",
    ]);
    if (authError) return authError;

    const { id } = await params;
    const supabase = await createAdminClient();
    await deleteProperty(supabase, id);

    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
