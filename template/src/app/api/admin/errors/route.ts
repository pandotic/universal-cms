import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin, apiError } from "@pandotic/universal-cms/middleware";
import {
  getErrors,
  type ErrorCategory,
  type ErrorSeverity,
} from "@pandotic/universal-cms/data/errors";

const VALID_SEVERITY: ErrorSeverity[] = ["info", "warning", "error", "critical"];
const VALID_CATEGORY: ErrorCategory[] = ["runtime", "api", "ui", "build"];

export async function GET(request: NextRequest) {
  const authClient = await createClient();
  const authError = await requireAdmin(authClient, request);
  if (authError) return authError;

  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    const severity = searchParams.get("severity") as ErrorSeverity | null;
    const category = searchParams.get("category") as ErrorCategory | null;
    const resolvedParam = searchParams.get("resolved");
    const resolved =
      resolvedParam === "true" ? true : resolvedParam === "false" ? false : undefined;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : undefined;

    const data = await getErrors(supabase, {
      severity: severity && VALID_SEVERITY.includes(severity) ? severity : undefined,
      category: category && VALID_CATEGORY.includes(category) ? category : undefined,
      resolved,
      limit,
    });

    return NextResponse.json({ data });
  } catch (e) {
    return apiError(e);
  }
}
