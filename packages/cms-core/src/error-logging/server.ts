import type { SupabaseClient } from "@supabase/supabase-js";
import {
  logError,
  type ErrorCategory,
  type ErrorSeverity,
  type LogErrorInput,
} from "../data/error-log";

export interface LogServerErrorContext {
  url?: string | null;
  component?: string | null;
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  user_agent?: string | null;
}

/**
 * Log a server-side error. Never throws — if persistence fails, the error is
 * printed to stderr so it still reaches Vercel/Netlify logs.
 */
export async function logServerError(
  client: SupabaseClient,
  error: unknown,
  context: LogServerErrorContext = {}
): Promise<void> {
  const input: LogErrorInput = {
    message: toMessage(error),
    stack: toStack(error),
    url: context.url ?? null,
    component: context.component ?? null,
    severity: context.severity ?? "error",
    category: context.category ?? "api",
    user_agent: context.user_agent ?? null,
  };
  try {
    await logError(client, input);
  } catch (persistErr) {
    // eslint-disable-next-line no-console
    console.error("[logServerError] failed to persist:", persistErr, "original:", input);
  }
}

/**
 * Wrap an async API handler so thrown errors are auto-logged before being
 * re-thrown. Compatible with Next.js route handlers and server actions.
 *
 * ```ts
 * export const POST = withErrorLogging(
 *   () => createAdminClient(),
 *   async (req) => { ... },
 *   { component: "api/things POST" }
 * );
 * ```
 */
export function withErrorLogging<TArgs extends unknown[], TResult>(
  getClient: () => SupabaseClient | Promise<SupabaseClient>,
  handler: (...args: TArgs) => Promise<TResult>,
  context: LogServerErrorContext = {}
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (err) {
      try {
        const client = await getClient();
        const reqUrl = extractUrlFromArgs(args) ?? context.url ?? null;
        await logServerError(client, err, { ...context, url: reqUrl });
      } catch {
        // ignore
      }
      throw err;
    }
  };
}

/**
 * Next.js instrumentation helper. Use from `instrumentation.ts`:
 *
 * ```ts
 * export async function onRequestError(err, request, context) {
 *   await reportNextRequestError(() => getAdminClient(), err, request, context);
 * }
 * ```
 */
export async function reportNextRequestError(
  getClient: () => SupabaseClient | Promise<SupabaseClient>,
  error: unknown,
  request: { path?: string; method?: string; headers?: Record<string, string | string[] | undefined> } | undefined,
  context: { routerKind?: string; routePath?: string; routeType?: string } | undefined
): Promise<void> {
  try {
    const client = await getClient();
    const header = (key: string) => {
      const v = request?.headers?.[key];
      if (Array.isArray(v)) return v[0] ?? null;
      return v ?? null;
    };
    await logServerError(client, error, {
      url: request?.path ?? null,
      component: context?.routePath
        ? `${context.routerKind ?? "next"}:${context.routePath}`
        : "next:request",
      category: "api",
      user_agent: header("user-agent"),
    });
  } catch {
    // never throw from instrumentation
  }
}

function toMessage(value: unknown): string {
  if (value instanceof Error) return value.message || String(value);
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toStack(value: unknown): string | null {
  if (value instanceof Error && typeof value.stack === "string") return value.stack;
  return null;
}

function extractUrlFromArgs(args: unknown[]): string | null {
  for (const arg of args) {
    if (arg && typeof arg === "object" && "url" in arg) {
      const url = (arg as { url?: unknown }).url;
      if (typeof url === "string") return url;
    }
  }
  return null;
}
