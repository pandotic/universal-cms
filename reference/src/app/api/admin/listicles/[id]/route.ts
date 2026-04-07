import { NextRequest, NextResponse } from "next/server";
import {
  getListicleById,
  updateListicle,
  deleteListicle,
  upsertListicleItems,
} from "@/lib/data/listicles";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const listicle = await getListicleById(id);
    if (!listicle) {
      return NextResponse.json(
        { error: "Listicle not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: listicle });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const { items, ...listicleFields } = body;

    const listicle = await updateListicle(id, listicleFields);

    let updatedItems;
    if (Array.isArray(items)) {
      updatedItems = await upsertListicleItems(id, items);
    }

    return NextResponse.json({
      data: { ...listicle, items: updatedItems },
    });
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
    await deleteListicle(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
