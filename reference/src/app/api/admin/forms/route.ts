import { NextRequest, NextResponse } from "next/server";
import { getAllForms, createForm } from "@/lib/data/forms";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const forms = await getAllForms();
    return NextResponse.json({ data: forms });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const form = await createForm(body);
    return NextResponse.json({ data: form }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
