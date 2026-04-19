"use client";

import type { ErrorCategory, ErrorSeverity } from "../data/error-log";

export interface ReportErrorInput {
  message: string;
  stack?: string | null;
  url?: string | null;
  component?: string | null;
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  user_agent?: string | null;
}

export interface ClientErrorCaptureOptions {
  /** Endpoint that accepts POSTed error payloads. Defaults to `/api/errors`. */
  endpoint?: string;
  /** Called for every captured error before sending. Return false to drop. */
  beforeSend?: (input: ReportErrorInput) => ReportErrorInput | false;
  /** Also log to console. Default true. */
  console?: boolean;
}

const DEFAULT_ENDPOINT = "/api/errors";

/**
 * Send a single error report to the ingest endpoint. Uses `sendBeacon` when
 * available so errors fired during unload still make it to the server.
 */
export async function reportError(
  input: ReportErrorInput,
  endpoint: string = DEFAULT_ENDPOINT
): Promise<void> {
  if (typeof window === "undefined") return;

  const payload: ReportErrorInput = {
    severity: "error",
    category: "runtime",
    url: typeof location !== "undefined" ? location.href : null,
    user_agent:
      typeof navigator !== "undefined" ? navigator.userAgent : null,
    ...input,
  };

  const body = JSON.stringify(payload);

  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(endpoint, blob);
      if (ok) return;
    }
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Swallow — we never want error reporting to itself throw.
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

let installed = false;

/**
 * Install window-level error listeners that forward uncaught errors and
 * unhandled promise rejections to the ingest endpoint.
 *
 * Safe to call more than once — subsequent calls are no-ops.
 */
export function installClientErrorCapture(
  options: ClientErrorCaptureOptions = {}
): () => void {
  if (typeof window === "undefined") return () => {};
  if (installed) return () => {};
  installed = true;

  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const logToConsole = options.console ?? true;

  const send = (input: ReportErrorInput) => {
    const processed = options.beforeSend ? options.beforeSend(input) : input;
    if (processed === false) return;
    if (logToConsole) {
      // eslint-disable-next-line no-console
      console.debug("[error-log]", processed.message, processed);
    }
    void reportError(processed, endpoint);
  };

  const onError = (event: ErrorEvent) => {
    send({
      message: toMessage(event.error ?? event.message),
      stack: toStack(event.error) ?? null,
      url: event.filename || (typeof location !== "undefined" ? location.href : null),
      severity: "error",
      category: "runtime",
    });
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    send({
      message: `Unhandled promise rejection: ${toMessage(event.reason)}`,
      stack: toStack(event.reason),
      severity: "error",
      category: "runtime",
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    installed = false;
  };
}
