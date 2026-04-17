"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function UserNav() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        setEmail(user?.email ?? null);
      });
    } catch {
      // Swallow — rendering a signed-out nav is the right fallback.
    }
  }, []);

  async function handleSignOut() {
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Fall through to the redirect regardless.
    }
    router.push("/login");
    router.refresh();
  }

  if (!email) return null;

  return (
    <div className="flex items-center gap-3 border-l border-zinc-800 pl-6">
      <span className="text-xs text-zinc-500 truncate max-w-[120px]">
        {email}
      </span>
      <button
        onClick={handleSignOut}
        className="text-xs text-zinc-500 hover:text-white transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
