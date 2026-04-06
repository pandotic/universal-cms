import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, apiError } from "@/lib/api/auth";
import {
  getInternalLinkStats,
  getLinkSuggestions,
  getAnchorTextGroups,
} from "@/lib/data/internal-links";
import { generateLinkSuggestions } from "@/lib/services/link-suggestions";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") ?? "stats";

    if (view === "suggestions") {
      const statusParam = searchParams.get("status");
      const status =
        statusParam === "pending" ||
        statusParam === "accepted" ||
        statusParam === "dismissed"
          ? statusParam
          : undefined;
      const data = await getLinkSuggestions(status);
      return NextResponse.json({ data });
    }

    if (view === "anchors") {
      const data = await getAnchorTextGroups();
      return NextResponse.json({ data });
    }

    // Default: link stats
    const data = await getInternalLinkStats();
    return NextResponse.json({ data });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));

    if (body.action === "generate-suggestions") {
      const result = await generateLinkSuggestions();
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json(
      { error: "Unknown action. Valid actions: generate-suggestions" },
      { status: 400 }
    );
  } catch (e) {
    return apiError(e);
  }
}
