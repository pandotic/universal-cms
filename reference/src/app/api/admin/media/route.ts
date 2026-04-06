import { NextRequest, NextResponse } from "next/server";
import { getAllMedia, uploadMedia, getMediaPublicUrl } from "@/lib/data/media";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const media = await getAllMedia();
    return NextResponse.json({ data: media });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const altText = (formData.get("alt_text") as string) || undefined;
    const caption = (formData.get("caption") as string) || undefined;
    const uploadedBy = (formData.get("uploaded_by") as string) || undefined;

    const media = await uploadMedia(file, altText, caption, uploadedBy);
    const publicUrl = getMediaPublicUrl(media.storage_path);

    return NextResponse.json(
      { data: { ...media, public_url: publicUrl } },
      { status: 201 }
    );
  } catch (e) {
    return apiError(e);
  }
}
