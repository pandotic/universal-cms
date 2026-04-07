import { NextRequest, NextResponse } from "next/server";
import { getRedirects, createRedirect } from "@/lib/data/link-checker";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const redirects = await getRedirects();
    return NextResponse.json({ data: redirects });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { from_path, to_path, redirect_type, notes, created_by } = body;

    if (!from_path || !to_path) {
      return NextResponse.json(
        { error: "from_path and to_path are required" },
        { status: 400 }
      );
    }

    const validTypes = [301, 302, 307];
    const type = redirect_type ? parseInt(String(redirect_type), 10) : 301;
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "redirect_type must be 301, 302, or 307" },
        { status: 400 }
      );
    }

    const redirect = await createRedirect(
      String(from_path),
      String(to_path),
      type as 301 | 302 | 307,
      notes ? String(notes) : undefined,
      created_by ? String(created_by) : undefined
    );

    return NextResponse.json({ data: redirect }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
