import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, updateSettings } from "@/lib/data/site-settings";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const settings = await getAllSettings();
    return NextResponse.json({ data: settings });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { settings } = body;

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: "settings must be an array of { key, value } objects" },
        { status: 400 }
      );
    }

    await updateSettings(settings);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
