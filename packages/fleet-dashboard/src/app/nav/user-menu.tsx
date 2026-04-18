"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function UserMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!email) {
    return (
      <Link
        href="/login"
        className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
      >
        Sign in
      </Link>
    );
  }

  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-800"
        aria-label="Account menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-[11px] font-semibold text-white">
          {initials}
        </span>
        <span className="hidden max-w-[140px] truncate text-zinc-300 sm:inline">
          {email}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl">
          <div className="border-b border-zinc-800 px-4 py-3">
            <div className="text-xs font-medium text-zinc-400">Signed in as</div>
            <div className="truncate text-sm text-white">{email}</div>
          </div>
          <div className="py-1">
            <Link
              href="/users"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <UserIcon className="h-4 w-4" /> Profile
            </Link>
            <Link
              href="/feature-flags"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>
          </div>
          <div className="border-t border-zinc-800 py-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
