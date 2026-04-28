"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Static-export-friendly sign-out: client-side signOut() call followed by
 * a redirect to the login page. The admin layout's auth listener also
 * sees the signed-out state and would redirect on its own — this page
 * gives operators an explicit URL to hit.
 */
export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.signOut().finally(() => {
      router.replace("/admin/login");
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <p className="text-sm text-zinc-400">Signing out…</p>
    </div>
  );
}
