import { reportNextRequestError } from "@pandotic/universal-cms/error-logging/server";

export async function register(): Promise<void> {
  // No-op — reserved for future tracing/metric hooks.
}

/**
 * Next.js calls this for every uncaught error in Server Components, Route
 * Handlers, and Server Actions. We forward them to the error_log table via the
 * universal-cms helper so they show up on /errors alongside client errors.
 */
export async function onRequestError(
  error: unknown,
  request: {
    path?: string;
    method?: string;
    headers?: Record<string, string | string[] | undefined>;
  },
  context: {
    routerKind?: string;
    routePath?: string;
    routeType?: string;
  }
): Promise<void> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    await reportNextRequestError(
      () => createAdminClient(),
      error,
      request,
      context
    );
  } catch {
    // Never throw from instrumentation.
  }
}
