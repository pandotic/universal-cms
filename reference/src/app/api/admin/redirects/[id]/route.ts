import { NextRequest, NextResponse } from "next/server";
import { updateRedirect, deleteRedirect } from "@/lib/data/link-checker";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

    const allowedFields = ["from_path", "to_path", "redirect_type", "is_regex", "is_active", "notes"] as const;
    type AllowedField = typeof allowedFields[number];
    const updates: Partial<Record<AllowedField, unknown>> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (updates.redirect_type !== undefined) {
      const type = parseInt(String(updates.redirect_type), 10);
      if (![301, 302, 307].includes(type)) {
        return NextResponse.json(
          { error: "redirect_type must be 301, 302, or 307" },
          { status: 400 }
        );
      }
      updates.redirect_type = type as 301 | 302 | 307;
    }

    const redirect = await updateRedirect(id, updates as Parameters<typeof updateRedirect>[1]);
    return NextResponse.json({ data: redirect });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    await deleteRedirect(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
