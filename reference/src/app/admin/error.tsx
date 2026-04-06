"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
    fetch('/api/error-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message || 'Unknown error',
        stack: error.stack,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        severity: 'error',
        category: 'ui',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      }),
    }).catch(() => {}); // never throw from error boundary
  }, [error]);

  const isSupabaseError =
    error.message?.includes("Supabase") ||
    error.message?.includes("SUPABASE") ||
    error.message?.includes("environment variable");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {isSupabaseError ? "Database Not Connected" : "Admin Error"}
        </h1>
        <p className="text-sm text-gray-600">
          {isSupabaseError
            ? "The database connection is not configured. Please ensure your Supabase environment variables are set correctly in your deployment settings."
            : error.message || "An unexpected error occurred in the admin panel."}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
