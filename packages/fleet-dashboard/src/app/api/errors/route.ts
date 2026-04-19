import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiError, requireHubRole } from "@pandotic/universal-cms/middleware";
import {
  getErrors,
  getErrorStats,
  logError,
  type ErrorCategory,
  type ErrorSeverity,
} from "@pandotic/universal-cms/data/errors";

const VALID_SEVERITY: ErrorSeverity[] = ["info", "warning", "error", "critical"];
const VALID_CATEGORY: ErrorCategory[] = ["runtime", "api", "ui", "build"];

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    if (!body || typeof body.message !== "string" || !body.message.trim()) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const severity = VALID_SEVERITY.includes(body.severity as ErrorSeverity)
      ? (body.severity as ErrorSeverity)
      : "error";
    const category = VALID_CATEGORY.includes(body.category as ErrorCategory)
      ? (body.category as ErrorCategory)
      : "runtime";

    const userAgent =
      (typeof body.user_agent === "string" ? body.user_agent : null) ??
      request.headers.get("user-agent");

    const supabase = await createAdminClient();
    await logError(supabase, {
      message: String(body.message).slice(0, 2000),
      stack: typeof body.stack === "string" ? body.stack.slice(0, 10000) : null,
      url: typeof body.url === "string" ? body.url.slice(0, 500) : null,
      component:
        typeof body.component === "string" ? body.component.slice(0, 200) : null,
      severity,
      category,
      user_agent: userAgent ? String(userAgent).slice(0, 500) : null,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const authError = await requireHubRole(authClient, request, [
      "super_admin",
      "group_admin",
      "member",
      "viewer",
    ]);
    if (authError) return authError;

    const url = new URL(request.url);
    const supabase = await createAdminClient();

    if (url.searchParams.get("stats") === "1") {
      const stats = await getErrorStats(supabase);
      return NextResponse.json({ data: stats });
    }

    const severity = url.searchParams.get("severity") as ErrorSeverity | null;
    const category = url.searchParams.get("category") as ErrorCategory | null;
    const resolvedParam = url.searchParams.get("resolved");
    const search = url.searchParams.get("search") ?? undefined;
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "100"), 500);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? "0"), 0);

    const errors = await getErrors(supabase, {
      severity: severity && VALID_SEVERITY.includes(severity) ? severity : undefined,
      category: category && VALID_CATEGORY.includes(category) ? category : undefined,
      resolved:
        resolvedParam === "true"
          ? true
          : resolvedParam === "false"
            ? false
            : undefined,
      search,
      limit,
      offset,
    });

    return NextResponse.json({ data: errors });
  } catch (e) {
    return apiError(e);
  }
}
