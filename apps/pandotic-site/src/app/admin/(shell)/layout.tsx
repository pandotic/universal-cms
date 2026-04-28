"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@pandotic/universal-cms/components/admin";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Wraps every page under `/admin` (except `/admin/login`) in cms-core's
 * AdminShell. Pandotic-site is a static export — no middleware or
 * server-side cookies — so auth is enforced client-side here. The login
 * page lives outside this route group so it renders without the shell.
 */
export default function AdminShellLayout({
  children,
}: React.PropsWithChildren) {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<
    "checking" | "authed" | "unauthed"
  >("checking");

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setAuthStatus(session?.user ? "authed" : "unauthed");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setAuthStatus(session?.user ? "authed" : "unauthed");
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authStatus === "unauthed") {
      const next =
        typeof window !== "undefined" ? window.location.pathname : "/admin";
      router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
    }
  }, [authStatus, router]);

  if (authStatus !== "authed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
