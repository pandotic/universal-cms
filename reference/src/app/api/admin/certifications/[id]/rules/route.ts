import { NextRequest, NextResponse } from "next/server";
import { addCertificationRule } from "@/lib/data/certifications";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const { rule_type, config } = body;

    if (!rule_type) {
      return NextResponse.json(
        { error: "rule_type is required" },
        { status: 400 }
      );
    }

    const rule = await addCertificationRule({
      certification_id: id,
      rule_type,
      config: config ?? {},
    });

    return NextResponse.json({ data: rule }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
