import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiError, requireHubRole } from "@pandotic/universal-cms/middleware";
import {
  deleteError,
  getErrorById,
  resolveError,
  unresolveError,
} from "@pandotic/universal-cms/data/errors";

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
    const entry = await getErrorById(supabase, id);
    if (!entry) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ data: entry });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin",
      "group_admin",
      "member",
    ]);
    if (authError) return authError;

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      resolved?: boolean;
    };
    const supabase = await createAdminClient();

    if (body.resolved === true) {
      const { data: userRes } = await authClient.auth.getUser();
      await resolveError(supabase, id, userRes.user?.id ?? null);
    } else if (body.resolved === false) {
      await unresolveError(supabase, id);
    } else {
      return NextResponse.json(
        { error: "resolved (boolean) required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
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
      "group_admin",
    ]);
    if (authError) return authError;

    const { id } = await params;
    const supabase = await createAdminClient();
    await deleteError(supabase, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
