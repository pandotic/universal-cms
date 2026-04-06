import { NextRequest, NextResponse } from "next/server";
import { getAllLinkChecks, getBrokenLinks } from "@/lib/data/link-checker";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const broken = searchParams.get("broken");
    const internal = searchParams.get("internal");
    const source = searchParams.get("source") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined;

    // Shorthand: ?broken=true returns only broken links fast path
    if (broken === "true" && !source && !internal) {
      const checks = await getBrokenLinks(limit);
      return NextResponse.json({ data: checks });
    }

    const result = await getAllLinkChecks({
      broken: broken !== null ? broken === "true" : undefined,
      internal: internal !== null ? internal === "true" : undefined,
      source,
      limit,
      offset,
    });

    return NextResponse.json({ data: result.checks, total: result.total });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));

    if (body?.action !== "run") {
      return NextResponse.json({ error: "action must be 'run'" }, { status: 400 });
    }

    // Kick off crawl in background — don't await
    import("@/lib/services/link-crawler").then(({ crawlInternalLinks }) => {
      crawlInternalLinks().catch((e) => {
        console.error("[link-crawler] background crawl failed:", e);
      });
    });

    return NextResponse.json({ ok: true, message: "Crawl started in background" });
  } catch (e) {
    return apiError(e);
  }
}
