"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function UserNav() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
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
