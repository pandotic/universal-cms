import { NextRequest, NextResponse } from "next/server";
import {
  getFormById,
  updateForm,
  deleteForm,
  getSubmissions,
} from "@/lib/data/forms";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const form = await getFormById(id);
    if (!form) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { submissions, total } = await getSubmissions(id, { limit: 50 });
    return NextResponse.json({ data: { ...form, submissions, submissionTotal: total } });
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
    const form = await updateForm(id, body);
    return NextResponse.json({ data: form });
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
    await deleteForm(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
