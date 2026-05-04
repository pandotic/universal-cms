"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@pandotic/universal-cms/components/admin";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
}

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
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setUser(session?.user ? toAuthUser(session.user) : null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ? toAuthUser(session.user) : null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (user === null) {
      const next =
        typeof window !== "undefined" ? window.location.pathname : "/admin";
      router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  return (
    <AdminShell
      userInfo={{ name: user.name, email: user.email }}
      onSignOut={async () => {
        await supabase.auth.signOut();
        router.replace("/admin/login");
      }}
    >
      {children}
    </AdminShell>
  );
}

function toAuthUser(raw: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): AuthUser {
  const meta = raw.user_metadata ?? {};
  const fullName =
    typeof meta.full_name === "string"
      ? meta.full_name
      : typeof meta.name === "string"
        ? meta.name
        : null;
  return {
    id: raw.id,
    email: raw.email ?? null,
    name: fullName,
  };
}
