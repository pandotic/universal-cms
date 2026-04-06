import { NextRequest, NextResponse } from "next/server";
import {
  getContentPageById,
  updateContentPage,
  deleteContentPage,
} from "@/lib/data/content-pages";
import { logActivity } from "@/lib/data/activity-log";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const page = await getContentPageById(id);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    return NextResponse.json({ data: page });
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

    // Check if this is a publish action
    const existingPage = await getContentPageById(id);
    const isPublishing =
      body.status === "published" && existingPage?.status !== "published";

    const page = await updateContentPage(id, body);

    if (isPublishing) {
      await logActivity({
        action: "publish",
        entity_type: "content_page",
        entity_id: id,
        entity_title: page.title,
      });
    }

    return NextResponse.json({ data: page });
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
    await deleteContentPage(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
