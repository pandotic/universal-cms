import { NextRequest, NextResponse } from "next/server";
import { deleteCertificationRule } from "@/lib/data/certifications";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { ruleId } = await params;
    await deleteCertificationRule(ruleId);
    return NextResponse.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
